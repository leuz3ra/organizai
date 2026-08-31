import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonContent,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  addOutline,
  closeOutline,
  trashOutline,
  flagOutline,
  checkmarkOutline,
  trophyOutline,
  chevronDownOutline
} from 'ionicons/icons';

import { MetasService } from '../../services/metas.service';
import { Meta, MetaPagamento } from '../../models/meta.model';


interface MetaComPagamentos extends Meta {
  pagamentos: MetaPagamento[];
  expandida: boolean;
  carregando: boolean;
}


@Component({
  selector: 'app-metas',
  standalone: true,
  templateUrl: './metas.page.html',
  styleUrls: ['./metas.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon
  ]
})
export class MetasPage implements OnInit {

  metas: MetaComPagamentos[] = [];

  carregandoMetas = false;

  mostrarModal = false;

  salvando = false;

  mostrarConfirmacaoExclusao = false;

  metaParaExcluir: string | null = null;

  readonly PERSONALIZAR = -1;

  opcoesMeses = [
    { valor: 3, label: '3 meses' },
    { valor: 6, label: '6 meses' },
    { valor: 12, label: '12 meses (1 ano)' },
    { valor: 18, label: '18 meses' },
    { valor: 24, label: '24 meses (2 anos)' },
    { valor: 36, label: '36 meses (3 anos)' },
    { valor: 48, label: '48 meses (4 anos)' },
    { valor: 60, label: '60 meses (5 anos)' },
    { valor: 72, label: '72 meses (6 anos)' },
    { valor: 84, label: '84 meses (7 anos)' },
    { valor: 96, label: '96 meses (8 anos)' },
    { valor: 108, label: '108 meses (9 anos)' },
    { valor: 120, label: '120 meses (10 anos)' },
    { valor: -1, label: '✏️ Personalizar...' },
  ];

  mesesPersonalizado: number | null = null;

  novaMetaForm = {
    titulo: '',
    descricao: '',
    valor_total: null as number | null,
    total_periodos: 12
  };

  get mesesEfetivos(): number {
    if (this.novaMetaForm.total_periodos === this.PERSONALIZAR) {
      return Number(this.mesesPersonalizado) || 0;
    }
    return Number(this.novaMetaForm.total_periodos) || 0;
  }

  get valorPorMesCalculado(): number | null {
    const total = Number(this.novaMetaForm.valor_total);
    const meses = this.mesesEfetivos;
    if (!total || !meses || meses < 1) return null;
    return total / meses;
  }

  erroForm = '';

  constructor(
    private router: Router,
    private metasService: MetasService
  ) {
    addIcons({
      arrowBackOutline,
      addOutline,
      closeOutline,
      trashOutline,
      flagOutline,
      checkmarkOutline,
      trophyOutline,
      chevronDownOutline
    });
  }

  async ngOnInit() {
    await this.carregarMetas();
  }


  // =====================================================
  // CARREGAR METAS
  // =====================================================

  async carregarMetas() {

    this.carregandoMetas = true;

    try {

      const metas = await this.metasService.listarMetas();

      this.metas = metas.map(m => ({
        ...m,
        pagamentos: [],
        expandida: false,
        carregando: false
      }));

    } catch (err) {
      console.error('Erro ao carregar metas:', err);
    } finally {
      this.carregandoMetas = false;
    }

  }


  // =====================================================
  // EXPANDIR / RECOLHER META
  // =====================================================

  async toggleExpandir(meta: MetaComPagamentos) {

    if (meta.expandida) {
      meta.expandida = false;
      return;
    }

    meta.expandida = true;
    meta.carregando = true;

    try {

      const pagamentos = await this.metasService.listarPagamentos(meta.id!);
      meta.pagamentos = pagamentos;

    } catch (err) {
      console.error('Erro ao carregar pagamentos:', err);
    } finally {
      meta.carregando = false;
    }

  }


  // =====================================================
  // OBTER ESTADO DO BLOCO
  // =====================================================

  getBlocoPago(meta: MetaComPagamentos, periodo: number): boolean {

    const pagamento = meta.pagamentos.find(p => p.periodo === periodo);
    return pagamento ? pagamento.pago : false;

  }

  getArrayPeriodos(total: number): number[] {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  getProgressoPorcentagem(meta: MetaComPagamentos): number {

    const pagos = meta.pagamentos.filter(p => p.pago).length;
    return Math.round((pagos / meta.total_periodos) * 100);

  }

  getTotalArrecadado(meta: MetaComPagamentos): number {

    const pagos = meta.pagamentos.filter(p => p.pago).length;
    return pagos * meta.valor_por_periodo;

  }

  isMetaConcluida(meta: MetaComPagamentos): boolean {
    return this.getProgressoPorcentagem(meta) === 100;
  }


  // =====================================================
  // TOGGLE BLOCO (MARCAR / DESMARCAR)
  // =====================================================

  async toggleBloco(meta: MetaComPagamentos, periodo: number) {

    const pagoAtual = this.getBlocoPago(meta, periodo);

    // Atualização otimista imediata na UI
    const existente = meta.pagamentos.find(p => p.periodo === periodo);

    if (existente) {
      existente.pago = !existente.pago;
    } else {
      meta.pagamentos.push({
        meta_id: meta.id!,
        periodo,
        pago: true
      });
    }

    try {

      const atualizado = await this.metasService.togglePagamento(
        meta.id!,
        periodo,
        pagoAtual
      );

      // Sincroniza com o resultado real do servidor
      const idx = meta.pagamentos.findIndex(p => p.periodo === periodo);
      if (idx >= 0) {
        meta.pagamentos[idx] = atualizado;
      }

    } catch (err) {

      console.error('Erro ao atualizar bloco:', err);

      // Reverte em caso de erro
      if (existente) {
        existente.pago = pagoAtual;
      } else {
        meta.pagamentos = meta.pagamentos.filter(p => p.periodo !== periodo);
      }

    }

  }


  // =====================================================
  // MODAL DE NOVA META
  // =====================================================

  abrirModal() {

    this.novaMetaForm = {
      titulo: '',
      descricao: '',
      valor_total: null,
      total_periodos: 12
    };
    this.mesesPersonalizado = null;
    this.erroForm = '';
    this.mostrarModal = true;

  }

  fecharModal() {
    this.mostrarModal = false;
  }

  async salvarMeta() {

    this.erroForm = '';

    if (!this.novaMetaForm.titulo.trim()) {
      this.erroForm = 'Informe o título da meta.';
      return;
    }

    if (
      !this.novaMetaForm.valor_total ||
      this.novaMetaForm.valor_total <= 0
    ) {
      this.erroForm = 'Informe um valor total válido.';
      return;
    }

    if (
      !this.novaMetaForm.total_periodos ||
      this.mesesEfetivos < 1
    ) {
      this.erroForm = 'Informe um número de meses válido.';
      return;
    }

    if (
      this.novaMetaForm.total_periodos === this.PERSONALIZAR &&
      (!this.mesesPersonalizado || this.mesesPersonalizado < 1)
    ) {
      this.erroForm = 'Informe a quantidade de meses personalizada.';
      return;
    }

    this.salvando = true;

    try {

      const meta = await this.metasService.criarMeta({
        titulo: this.novaMetaForm.titulo.trim(),
        descricao: this.novaMetaForm.descricao.trim() || null,
        valor_total: Number(this.novaMetaForm.valor_total),
        valor_por_periodo: this.valorPorMesCalculado!,
        total_periodos: this.mesesEfetivos
      });

      this.metas.unshift({
        ...meta,
        pagamentos: [],
        expandida: false,
        carregando: false
      });

      this.fecharModal();

    } catch (err: any) {
      console.error('Erro ao salvar meta:', err);
      this.erroForm = err?.message || err?.error_description || 'Erro ao salvar. Tente novamente.';
    } finally {
      this.salvando = false;
    }

  }


  // =====================================================
  // EXCLUIR META
  // =====================================================

  confirmarExclusao(metaId: string, event: Event) {
    event.stopPropagation();
    this.metaParaExcluir = metaId;
    this.mostrarConfirmacaoExclusao = true;
  }

  cancelarExclusao() {
    this.metaParaExcluir = null;
    this.mostrarConfirmacaoExclusao = false;
  }

  async excluirMeta() {

    if (!this.metaParaExcluir) return;

    try {

      await this.metasService.excluirMeta(this.metaParaExcluir);

      this.metas = this.metas.filter(m => m.id !== this.metaParaExcluir);

    } catch (err) {
      console.error('Erro ao excluir meta:', err);
    } finally {
      this.cancelarExclusao();
    }

  }


  // =====================================================
  // NAVEGAÇÃO
  // =====================================================

  voltar() {
    this.router.navigate(['/dashboard']);
  }

  formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

}
