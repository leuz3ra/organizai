import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, addOutline, closeOutline, trashOutline,
  documentTextOutline, checkmarkCircleOutline, ellipseOutline,
  calendarOutline, alertCircleOutline, layersOutline, cardOutline,
  cashOutline, informationCircleOutline, chevronForwardOutline, checkmarkOutline,
  removeOutline, removeCircleOutline, addCircleOutline
} from 'ionicons/icons';
import { UserStorageService } from '../../services/user-storage.service';

export type StatusBoleto = 'pendente' | 'pago' | 'vencido';
export type FiltroBoleto = 'todos' | StatusBoleto | 'parcelado';

export interface Boleto {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string; // YYYY-MM-DD
  status: StatusBoleto;
  banco?: string;
  criadoEm: string;
  parcelado?: boolean;
  parcelaAtual?: number;
  totalParcelas?: number;
  grupoId?: string;
  nomeOriginal?: string;
  valorTotalCompra?: number;
  temJuros?: boolean;
  taxaJuros?: number;
}

export interface GrupoParcelamento {
  grupoId: string;
  nome: string;
  totalParcelas: number;
  parcelasPagas: number;
  valorParcela: number;
  valorTotal: number;
  valorRestante: number;
  proximoVencimento?: string;
  percentualPago: number;
  concluido: boolean;
  temJuros?: boolean;
  taxaJuros?: number;
  itens: Boleto[];
}

@Component({
  selector: 'app-boletos',
  standalone: true,
  templateUrl: './boletos.page.html',
  styleUrls: ['./boletos.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonIcon]
})
export class BoletosPage implements OnInit {

  boletos: Boleto[] = [];
  filtro: FiltroBoleto = 'todos';
  mostrarModal = false;
  mostrarConfirmacao = false;
  boletoParaExcluir: Boleto | null = null;
  grupoParaExcluir: GrupoParcelamento | null = null;
  erroForm = '';

  novaForm = {
    descricao: '',
    valor: null as number | null,
    vencimento: '',
    banco: '',
    ehParcelado: false,
    totalParcelas: 2,
    tipoValor: 'total' as 'parcela' | 'total',
    temJuros: false,
    taxaJuros: null as number | null
  };

  readonly parcelasOpcoes = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userStorage: UserStorageService
  ) {
    addIcons({
      arrowBackOutline, addOutline, closeOutline, trashOutline,
      documentTextOutline, checkmarkCircleOutline, ellipseOutline,
      calendarOutline, alertCircleOutline, layersOutline, cardOutline,
      cashOutline, informationCircleOutline, chevronForwardOutline, checkmarkOutline,
      removeOutline, removeCircleOutline, addCircleOutline
    });
  }

  async ngOnInit() {
    await this.userStorage.carregarUsuarioAtual();
    this.route.queryParams.subscribe(params => {
      if (params['filtro'] && ['todos', 'pendente', 'pago', 'vencido', 'parcelado'].includes(params['filtro'])) {
        this.filtro = params['filtro'] as FiltroBoleto;
      }
    });
    this.carregar();
    this.atualizarVencidos();
  }

  async ionViewWillEnter() {
    await this.userStorage.carregarUsuarioAtual();
    this.carregar();
    this.atualizarVencidos();
  }

  carregar() {
    try {
      const raw = this.userStorage.getItem('boletos');
      this.boletos = raw ? JSON.parse(raw) : [];
    } catch {
      this.boletos = [];
    }
  }

  salvarLS() {
    this.userStorage.setItem('boletos', JSON.stringify(this.boletos));
  }

  atualizarVencidos() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    let alterado = false;
    this.boletos.forEach(b => {
      if (b.status === 'pendente' && new Date(b.vencimento + 'T00:00:00') < hoje) {
        b.status = 'vencido';
        alterado = true;
      }
    });
    if (alterado) this.salvarLS();
  }

  get valorTotalCalculado(): number {
    const v = Number(this.novaForm.valor) || 0;
    if (!this.novaForm.ehParcelado) return v;
    const p = Math.max(1, Number(this.novaForm.totalParcelas) || 1);
    if (this.novaForm.tipoValor === 'parcela') {
      return Number((v * p).toFixed(2));
    }
    // tipoValor === 'total'
    if (this.novaForm.temJuros && this.novaForm.taxaJuros && this.novaForm.taxaJuros > 0) {
      const juros = v * (Number(this.novaForm.taxaJuros) / 100);
      return Number((v + juros).toFixed(2));
    }
    return v;
  }

  get valorParcelaCalculado(): number {
    const v = Number(this.novaForm.valor) || 0;
    if (!this.novaForm.ehParcelado) return v;
    const p = Math.max(1, Number(this.novaForm.totalParcelas) || 1);
    if (this.novaForm.tipoValor === 'parcela') {
      return v;
    }
    return Number((this.valorTotalCalculado / p).toFixed(2));
  }

  get gruposParcelamento(): GrupoParcelamento[] {
    const mapa = new Map<string, Boleto[]>();
    this.boletos.filter(b => b.parcelado && b.grupoId).forEach(b => {
      const lista = mapa.get(b.grupoId!) || [];
      lista.push(b);
      mapa.set(b.grupoId!, lista);
    });

    const res: GrupoParcelamento[] = [];
    mapa.forEach((itens, grupoId) => {
      itens.sort((a, b) => (a.parcelaAtual || 0) - (b.parcelaAtual || 0));
      const primeiro = itens[0];
      const totalParcelas = primeiro.totalParcelas || itens.length;
      const pagas = itens.filter(b => b.status === 'pago').length;
      const valorParcela = primeiro.valor;
      const valorTotal = primeiro.valorTotalCompra || (valorParcela * totalParcelas);
      const pendentes = itens.filter(b => b.status !== 'pago');
      const valorRestante = pendentes.reduce((s, b) => s + b.valor, 0);
      const proximo = pendentes.length > 0 ? pendentes[0].vencimento : undefined;
      const percentualPago = totalParcelas > 0 ? Math.round((pagas / totalParcelas) * 100) : 0;

      res.push({
        grupoId,
        nome: primeiro.nomeOriginal || primeiro.descricao.replace(/\s*\(\d+\/\d+\)$/, ''),
        totalParcelas,
        parcelasPagas: pagas,
        valorParcela,
        valorTotal,
        valorRestante,
        proximoVencimento: proximo,
        percentualPago,
        concluido: pagas >= totalParcelas,
        temJuros: primeiro.temJuros,
        taxaJuros: primeiro.taxaJuros,
        itens
      });
    });

    return res;
  }

  get totalRestanteParcelamentos(): number {
    return this.gruposParcelamento.reduce((s, g) => s + g.valorRestante, 0);
  }

  get boletosAvulsos(): Boleto[] {
    return this.filtrados.filter(b => !b.parcelado);
  }

  diminuirParcela(grupo: GrupoParcelamento, event?: Event) {
    if (event) event.stopPropagation();
    const proximaPendente = this.boletos
      .filter(b => b.grupoId === grupo.grupoId && b.status !== 'pago')
      .sort((a, b) => (a.parcelaAtual || 0) - (b.parcelaAtual || 0))[0];

    if (proximaPendente) {
      proximaPendente.status = 'pago';
      this.salvarLS();
    }
  }

  reverterParcela(grupo: GrupoParcelamento, event?: Event) {
    if (event) event.stopPropagation();
    const ultimaPaga = this.boletos
      .filter(b => b.grupoId === grupo.grupoId && b.status === 'pago')
      .sort((a, b) => (b.parcelaAtual || 0) - (a.parcelaAtual || 0))[0];

    if (ultimaPaga) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      ultimaPaga.status = new Date(ultimaPaga.vencimento + 'T00:00:00') < hoje ? 'vencido' : 'pendente';
      this.salvarLS();
    }
  }

  iniciarExcluirGrupo(grupo: GrupoParcelamento, event?: Event) {
    if (event) event.stopPropagation();
    this.grupoParaExcluir = grupo;
    this.boletoParaExcluir = null;
    this.mostrarConfirmacao = true;
  }

  get filtrados(): Boleto[] {
    let l = this.boletos;
    if (this.filtro === 'parcelado') {
      l = this.boletos.filter(b => b.parcelado);
    } else if (this.filtro !== 'todos') {
      l = this.boletos.filter(b => b.status === this.filtro);
    }

    return l.sort((a, b) => {
      const o: Record<StatusBoleto, number> = { vencido: 0, pendente: 1, pago: 2 };
      return o[a.status] - o[b.status] || a.vencimento.localeCompare(b.vencimento);
    });
  }

  get totalEmAberto(): number {
    return this.boletos.filter(b => b.status !== 'pago').reduce((s, b) => s + b.valor, 0);
  }

  get totalPago(): number {
    return this.boletos.filter(b => b.status === 'pago').reduce((s, b) => s + b.valor, 0);
  }

  get cnt(): Record<string, number> {
    return {
      todos: this.boletos.length,
      pendente: this.boletos.filter(b => b.status === 'pendente').length,
      pago: this.boletos.filter(b => b.status === 'pago').length,
      vencido: this.boletos.filter(b => b.status === 'vencido').length,
      parcelado: this.gruposParcelamento.length
    };
  }

  togglePago(b: Boleto) {
    if (b.status === 'pago') {
      const v = new Date(b.vencimento + 'T00:00:00');
      const h = new Date();
      h.setHours(0, 0, 0, 0);
      b.status = v < h ? 'vencido' : 'pendente';
    } else {
      b.status = 'pago';
    }
    this.salvarLS();
  }

  iniciarExcluir(b: Boleto, e: Event) {
    e.stopPropagation();
    this.boletoParaExcluir = b;
    this.grupoParaExcluir = null;
    this.mostrarConfirmacao = true;
  }

  confirmarExclusao() {
    if (this.grupoParaExcluir) {
      this.boletos = this.boletos.filter(b => b.grupoId !== this.grupoParaExcluir!.grupoId);
      this.salvarLS();
    } else if (this.boletoParaExcluir) {
      if (this.boletoParaExcluir.grupoId) {
        this.boletos = this.boletos.filter(b => b.id !== this.boletoParaExcluir!.id);
      } else {
        this.boletos = this.boletos.filter(b => b.id !== this.boletoParaExcluir!.id);
      }
      this.salvarLS();
    }
    this.cancelarExclusao();
  }

  cancelarExclusao() {
    this.mostrarConfirmacao = false;
    this.boletoParaExcluir = null;
    this.grupoParaExcluir = null;
  }

  abrirModal() {
    this.novaForm = {
      descricao: '',
      valor: null,
      vencimento: this.fmt(new Date()),
      banco: '',
      ehParcelado: false,
      totalParcelas: 2,
      tipoValor: 'total',
      temJuros: false,
      taxaJuros: null
    };
    this.erroForm = '';
    this.mostrarModal = true;
  }

  fecharModal() {
    this.mostrarModal = false;
  }

  salvar() {
    this.erroForm = '';
    if (!this.novaForm.descricao?.trim()) {
      this.erroForm = 'Informe a descrição.';
      return;
    }
    if (!this.novaForm.valor || this.novaForm.valor <= 0) {
      this.erroForm = 'Informe um valor válido.';
      return;
    }
    if (!this.novaForm.vencimento) {
      this.erroForm = 'Informe a data de vencimento.';
      return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (this.novaForm.ehParcelado) {
      const totalParc = Math.max(2, Math.min(60, Number(this.novaForm.totalParcelas) || 2));
      const valParcela = Number(this.valorParcelaCalculado.toFixed(2));
      const valTotal = Number(this.valorTotalCalculado.toFixed(2));
      const grupoId = 'parc_' + this.id();
      const nomeBase = this.novaForm.descricao.trim();

      const [anoStr, mesStr, diaStr] = this.novaForm.vencimento.split('-');
      const anoBase = parseInt(anoStr, 10);
      const mesBase = parseInt(mesStr, 10) - 1;
      const diaBase = parseInt(diaStr, 10);

      const novos: Boleto[] = [];

      for (let i = 0; i < totalParc; i++) {
        const dataAlvoMes = new Date(anoBase, mesBase + i, 1);
        const ultimoDia = new Date(dataAlvoMes.getFullYear(), dataAlvoMes.getMonth() + 1, 0).getDate();
        const diaFinal = Math.min(diaBase, ultimoDia);
        const dataVenc = new Date(dataAlvoMes.getFullYear(), dataAlvoMes.getMonth(), diaFinal);
        const vencStr = `${dataVenc.getFullYear()}-${String(dataVenc.getMonth() + 1).padStart(2, '0')}-${String(diaFinal).padStart(2, '0')}`;
        
        const v = new Date(vencStr + 'T00:00:00');
        novos.push({
          id: this.id(),
          descricao: `${nomeBase} (${i + 1}/${totalParc})`,
          nomeOriginal: nomeBase,
          valor: valParcela,
          vencimento: vencStr,
          status: v < hoje ? 'vencido' : 'pendente',
          banco: this.novaForm.banco?.trim() || undefined,
          criadoEm: new Date().toISOString(),
          parcelado: true,
          parcelaAtual: i + 1,
          totalParcelas: totalParc,
          grupoId: grupoId,
          valorTotalCompra: valTotal,
          temJuros: this.novaForm.temJuros,
          taxaJuros: (this.novaForm.temJuros && this.novaForm.taxaJuros) ? Number(this.novaForm.taxaJuros) : undefined
        });
      }

      this.boletos = [...novos, ...this.boletos];
    } else {
      const v = new Date(this.novaForm.vencimento + 'T00:00:00');
      this.boletos.unshift({
        id: this.id(),
        descricao: this.novaForm.descricao.trim(),
        valor: Number(this.novaForm.valor),
        vencimento: this.novaForm.vencimento,
        status: v < hoje ? 'vencido' : 'pendente',
        banco: this.novaForm.banco?.trim() || undefined,
        criadoEm: new Date().toISOString()
      });
    }

    this.salvarLS();
    this.fecharModal();
  }

  getDias(data: string): number {
    const h = new Date();
    h.setHours(0, 0, 0, 0);
    return Math.ceil((new Date(data + 'T00:00:00').getTime() - h.getTime()) / 86400000);
  }

  getTextoVenc(b: Boleto): string {
    if (b.status === 'pago') return 'Pago ✓';
    const d = this.getDias(b.vencimento);
    if (d < 0) return `Venceu há ${Math.abs(d)}d`;
    if (d === 0) return 'Vence hoje!';
    if (d === 1) return 'Amanhã';
    return `${d} dias`;
  }

  fmtMoeda(v: number): string {
    return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  fmtData(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private fmt(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  private id(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  voltar() {
    this.router.navigate(['/pagamentos']);
  }

  setFiltro(f: FiltroBoleto) {
    this.filtro = f;
  }
}
