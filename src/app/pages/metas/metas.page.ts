import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonContent,
  IonIcon,
  IonSelect,
  IonSelectOption
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
import { formatBRL } from '../../utils/formatters';
import { Meta, MetaPagamento } from '../../models/meta.model';

interface MetaComPagamentos extends Meta {
  pagamentos: MetaPagamento[];
  expandida: boolean;
  carregando: boolean;
}

function parseNum(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let s = String(val).replace(/\s/g, '').replace(/R\$/gi, '').trim();
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

@Component({
  selector: 'app-metas',
  standalone: true,
  templateUrl: './metas.page.html',
  styleUrls: ['./metas.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonSelect,
    IonSelectOption
  ]
})
export class MetasPage implements OnInit, OnDestroy {

  metas: MetaComPagamentos[] = [];

  carregandoMetas = false;

  mostrarModal = false;

  salvando = false;

  mostrarConfirmacaoExclusao = false;

  metaParaExcluir: string | null = null;

  mostrarPopupConclusao = false;

  metaConcluidaTitulo = '';

  private _popupTimer: any = null;

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
    const total = parseNum(this.novaMetaForm.valor_total);
    const meses = this.mesesEfetivos;
    if (!total || !meses || meses < 1) return null;
    return Number((total / meses).toFixed(2));
  }

  erroForm = '';

  constructor(
    private router: Router,
    private metasService: MetasService,
    private cdr: ChangeDetectorRef
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

  async ionViewWillEnter() {
    // Recarrega metas apenas se a lista está vazia (evita fetch duplo)
    if (this.metas.length === 0) {
      await this.carregarMetas();
    }
  }

  ngOnDestroy() {
    if (this._popupTimer) clearTimeout(this._popupTimer);
  }


  // =====================================================
  // CARREGAR METAS COM PAGAMENTOS
  // =====================================================

  async carregarMetas() {
    if (this.carregandoMetas) return; // Evita fetches paralelos
    this.carregandoMetas = true;
    this.cdr.markForCheck();

    try {
      const [metas, todosPagamentos] = await Promise.all([
        this.metasService.listarMetas(),
        this.metasService.listarTodosPagamentosUsuario()
      ]);

      this.metas = metas.map(m => {
        const pagamentosDaMeta = todosPagamentos.filter(p => p.meta_id === m.id);
        return {
          ...m,
          valor_total: parseNum(m.valor_total),
          valor_por_periodo: parseNum(m.valor_por_periodo),
          total_periodos: Math.max(1, Math.round(parseNum(m.total_periodos))),
          pagamentos: pagamentosDaMeta,
          expandida: false,
          carregando: false
        };
      });

    } catch (err) {
      console.error('Erro ao carregar metas:', err);
    } finally {
      this.carregandoMetas = false;
      this.cdr.markForCheck();
    }
  }


  // =====================================================
  // EXPANDIR / RECOLHER META
  // =====================================================

  async toggleExpandir(meta: MetaComPagamentos) {
    if (meta.expandida) {
      meta.expandida = false;
      this.cdr.markForCheck();
      return;
    }

    meta.expandida = true;
    this.cdr.markForCheck();

    if (meta.pagamentos.length === 0 && meta.id) {
      meta.carregando = true;
      this.cdr.markForCheck();
      try {
        const pagamentos = await this.metasService.listarPagamentos(meta.id);
        meta.pagamentos = pagamentos;
      } catch (err) {
        console.error('Erro ao carregar pagamentos detalhados:', err);
      } finally {
        meta.carregando = false;
        this.cdr.markForCheck();
      }
    }
  }


  // =====================================================
  // OBTER ESTADO DO BLOCO
  // =====================================================

  getBlocoPago(meta: MetaComPagamentos, periodo: number): boolean {
    const pagamento = meta.pagamentos.find(p => p.periodo === periodo);
    return pagamento ? Boolean(pagamento.pago) : false;
  }

  getArrayPeriodos(total: number): number[] {
    const n = Math.max(1, Math.round(parseNum(total)));
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  getProgressoPorcentagem(meta: MetaComPagamentos): number {
    const total = Math.max(1, Math.round(parseNum(meta.total_periodos)));
    const pagos = (meta.pagamentos || []).filter(p => p.pago).length;
    return Math.min(100, Math.round((pagos / total) * 100));
  }

  getTotalArrecadado(meta: MetaComPagamentos): number {
    const total = Math.max(1, Math.round(parseNum(meta.total_periodos)));
    const pagos = (meta.pagamentos || []).filter(p => p.pago).length;
    
    if (pagos === total) {
      return parseNum(meta.valor_total);
    }

    const valorPorPeriodo = parseNum(meta.valor_por_periodo);
    return Number((pagos * valorPorPeriodo).toFixed(2));
  }

  isMetaConcluida(meta: MetaComPagamentos): boolean {
    return this.getProgressoPorcentagem(meta) === 100;
  }


  // =====================================================
  // TOGGLE BLOCO (MARCAR / DESMARCAR)
  // =====================================================

  async toggleBloco(meta: MetaComPagamentos, periodo: number) {
    const pagoAtual = this.getBlocoPago(meta, periodo);
    const eraConcluidaAntes = this.isMetaConcluida(meta);

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

      const idx = meta.pagamentos.findIndex(p => p.periodo === periodo);
      if (idx >= 0) {
        meta.pagamentos[idx] = atualizado;
      }

      // Dispara popup Duolingo se acabou de concluir
      if (!eraConcluidaAntes && this.isMetaConcluida(meta)) {
        this.metaConcluidaTitulo = meta.titulo;
        this.mostrarPopupConclusao = true;
        this.cdr.markForCheck();
        if (this._popupTimer) clearTimeout(this._popupTimer);
        this._popupTimer = setTimeout(() => {
          this.mostrarPopupConclusao = false;
          this.cdr.markForCheck();
        }, 5000);
      }

    } catch (err) {
      console.error('Erro ao atualizar bloco:', err);
      if (existente) {
        existente.pago = pagoAtual;
      } else {
        meta.pagamentos = meta.pagamentos.filter(p => p.periodo !== periodo);
      }
    }
  }

  fecharPopupConclusao() {
    this.mostrarPopupConclusao = false;
    if (this._popupTimer) clearTimeout(this._popupTimer);
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

    if (!this.novaMetaForm.titulo?.trim()) {
      this.erroForm = 'Informe o título da meta.';
      return;
    }

    const valorTotal = parseNum(this.novaMetaForm.valor_total);
    if (!valorTotal || valorTotal <= 0) {
      this.erroForm = 'Informe um valor total válido.';
      return;
    }

    const meses = this.mesesEfetivos;
    if (!meses || meses < 1) {
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
      const valorPorPeriodo = Number((valorTotal / meses).toFixed(2));

      const meta = await this.metasService.criarMeta({
        titulo: this.novaMetaForm.titulo.trim(),
        descricao: this.novaMetaForm.descricao?.trim() || null,
        valor_total: valorTotal,
        valor_por_periodo: valorPorPeriodo,
        total_periodos: meses
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
  // FORMATADORES E NAVEGAÇÃO
  // =====================================================

  voltar() {
    this.router.navigate(['/dashboard']);
  }

  formatarMoeda(valor: any): string {
    const n = parseNum(valor);
    return formatBRL(n);
  }

}
