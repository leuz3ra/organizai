import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonIcon
} from '@ionic/angular/standalone';

import { Router } from '@angular/router';

import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  addOutline,
  trashOutline,
  refreshOutline,
  closeOutline,
  sparklesOutline,
  calendarOutline,
  trendingUpOutline,
  chevronDownOutline,
  checkmarkOutline
} from 'ionicons/icons';

import { RendasService, parseNum } from '../../services/rendas.service';
import { Renda } from '../../models/renda.model';

export interface TipoAtivo {
  id: string;
  nome: string;
  taxa: number;
  icone: string;
  tituloSugerido: string;
}

@Component({
  selector: 'app-rendas',
  standalone: true,
  templateUrl: './rendas.page.html',
  styleUrls: ['./rendas.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon
  ]
})
export class RendasPage implements OnInit, OnDestroy {

  // =====================================================
  // DADOS
  // =====================================================

  rendas: Renda[] = [];
  total = 0;

  // =====================================================
  // ESTADOS DE CARREGAMENTO
  // =====================================================

  carregando = false;
  erro = '';
  excluindoId: string | null = null;

  // =====================================================
  // ATIVOS PRÉ-CONFIGURADOS
  // =====================================================

  readonly tiposAtivos: TipoAtivo[] = [
    { id: 'cdb_100', nome: 'CDB 100% CDI', taxa: 10.75, icone: '🏦', tituloSugerido: 'Meu CDB 100% CDI' },
    { id: 'cdb_110', nome: 'CDB 110% CDI', taxa: 11.80, icone: '📈', tituloSugerido: 'CDB 110% CDI' },
    { id: 'tesouro_selic', nome: 'Tesouro Selic', taxa: 10.75, icone: '🛡️', tituloSugerido: 'Reserva no Tesouro Selic' },
    { id: 'tesouro_ipca', nome: 'Tesouro IPCA+', taxa: 11.60, icone: '🔒', tituloSugerido: 'Tesouro IPCA+ Proteção' },
    { id: 'tesouro_pre', nome: 'Tesouro Prefixado', taxa: 12.20, icone: '🏷️', tituloSugerido: 'Tesouro Prefixado' },
    { id: 'lci_lca', nome: 'LCI / LCA (Isento IR)', taxa: 9.60, icone: '🌾', tituloSugerido: 'Minha LCI / LCA' },
    { id: 'poupanca', nome: 'Poupança', taxa: 6.17, icone: '🐷', tituloSugerido: 'Minha Poupança' },
    { id: 'fiis', nome: 'Fundos Imobiliários', taxa: 10.50, icone: '🏢', tituloSugerido: 'Fundos Imobiliários' },
    { id: 'acoes', nome: 'Ações / Dividendos', taxa: 12.50, icone: '📊', tituloSugerido: 'Carteira de Ações' },
    { id: 'personalizado', nome: 'Outro / Personalizado', taxa: 10.00, icone: '⚙️', tituloSugerido: 'Meu Investimento' }
  ];

  tipoSelecionadoId = 'cdb_100';
  taxaEditadaManualmente = false;

  // =====================================================
  // MODAL NOVO INVESTIMENTO
  // =====================================================

  mostrarModalNovo = false;
  salvandoNovo = false;
  erroNovoForm = '';

  novoForm = {
    titulo: '',
    tipo_investimento: '',
    valor_investido: null as number | null,
    percentual_rendimento: null as number | null,
    data_recebimento: '',
    descricao: ''
  };

  // =====================================================
  // MODAL CONFIRMAR EXCLUSÃO
  // =====================================================

  mostrarConfirmacaoExclusao = false;
  idParaExcluir: string | null = null;

  // =====================================================
  // SIMULAÇÃO AUTOMÁTICA
  // =====================================================

  private intervaloSimulacao: ReturnType<typeof setInterval> | null = null;
  private readonly INTERVALO_SIMULACAO = 30000;


  constructor(
    private router: Router,
    private rendasService: RendasService
  ) {
    addIcons({
      arrowBackOutline,
      addOutline,
      trashOutline,
      refreshOutline,
      closeOutline,
      sparklesOutline,
      calendarOutline,
      trendingUpOutline,
      chevronDownOutline,
      checkmarkOutline
    });
  }


  // =====================================================
  // CICLO DE VIDA
  // =====================================================

  ngOnInit(): void {
    this.listarRendas();
  }

  ngOnDestroy(): void {
    this.pararSimulacao();
  }


  // =====================================================
  // LISTAR INVESTIMENTOS
  // =====================================================

  async listarRendas(): Promise<void> {
    if (this.carregando) return;

    this.carregando = true;
    this.erro = '';

    try {
      const dados = await this.rendasService.listarRendas();
      this.rendas = dados;
      this.atualizarSimulacao();
      this.iniciarSimulacao();
    } catch (error) {
      console.error('Erro ao carregar investimentos:', error);
      this.erro = 'Não foi possível carregar seus investimentos.';
    } finally {
      this.carregando = false;
    }
  }


  // =====================================================
  // MODAL NOVO INVESTIMENTO
  // =====================================================

  abrirModalInvestimento() {
    const hoje = new Date().toISOString().split('T')[0];
    const inicial = this.tiposAtivos[0];

    this.tipoSelecionadoId = inicial.id;
    this.taxaEditadaManualmente = false;

    this.novoForm = {
      titulo: inicial.tituloSugerido,
      tipo_investimento: inicial.nome,
      valor_investido: null,
      percentual_rendimento: inicial.taxa,
      data_recebimento: hoje,
      descricao: ''
    };

    this.erroNovoForm = '';
    this.mostrarModalNovo = true;
  }

  fecharModalInvestimento() {
    this.mostrarModalNovo = false;
  }

  onTipoAtivoChange() {
    const selecionado = this.tiposAtivos.find(t => t.id === this.tipoSelecionadoId) || this.tiposAtivos[0];
    this.novoForm.tipo_investimento = selecionado.nome;

    this.novoForm.percentual_rendimento = selecionado.taxa;
    this.taxaEditadaManualmente = false;

    const titulosConhecidos = this.tiposAtivos.map(t => t.tituloSugerido);
    if (!this.novoForm.titulo || titulosConhecidos.includes(this.novoForm.titulo)) {
      this.novoForm.titulo = selecionado.tituloSugerido;
    }
  }

  onTaxaManual() {
    this.taxaEditadaManualmente = true;
  }

  adicionarValorRapido(adicional: number) {
    const atual = parseNum(this.novoForm.valor_investido);
    this.novoForm.valor_investido = atual + adicional;
  }

  limparValor() {
    this.novoForm.valor_investido = null;
  }

  // =====================================================
  // PROJEÇÃO DINÂMICA
  // =====================================================

  get lucroEstimado1Ano(): number {
    const v = parseNum(this.novoForm.valor_investido);
    const taxa = parseNum(this.novoForm.percentual_rendimento);
    if (v <= 0 || taxa <= 0) return 0;
    return Number((v * (taxa / 100)).toFixed(2));
  }

  get saldoEstimado1Ano(): number {
    const v = parseNum(this.novoForm.valor_investido);
    return Number((v + this.lucroEstimado1Ano).toFixed(2));
  }

  async salvarNovoInvestimento(): Promise<void> {
    this.erroNovoForm = '';

    if (!this.novoForm.titulo?.trim()) {
      this.erroNovoForm = 'Informe um título para o investimento.';
      return;
    }
    if (!this.novoForm.tipo_investimento?.trim()) {
      this.erroNovoForm = 'Selecione o tipo de investimento.';
      return;
    }

    const valor = parseNum(this.novoForm.valor_investido);
    if (!valor || valor <= 0) {
      this.erroNovoForm = 'Informe um valor investido válido.';
      return;
    }

    const taxa = parseNum(this.novoForm.percentual_rendimento);
    if (this.novoForm.percentual_rendimento === null || taxa < 0) {
      this.erroNovoForm = 'Informe a rentabilidade anual estimada.';
      return;
    }
    if (!this.novoForm.data_recebimento) {
      this.erroNovoForm = 'Informe a data de início da aplicação.';
      return;
    }

    this.salvandoNovo = true;

    try {
      const investimento: Renda = {
        titulo: this.novoForm.titulo.trim(),
        categoria: 'Investimento',
        tipo_investimento: this.novoForm.tipo_investimento.trim(),
        valor_investido: valor,
        percentual_rendimento: taxa,
        rendimento: 0,
        saldo_atual: valor,
        data_recebimento: this.novoForm.data_recebimento,
        descricao: this.novoForm.descricao?.trim() || undefined
      };

      const salvo = await this.rendasService.salvarRenda(investimento);

      this.rendas.unshift(salvo);
      this.atualizarSimulacao();
      this.fecharModalInvestimento();

    } catch (error: any) {
      console.error('Erro ao salvar investimento:', error);
      this.erroNovoForm = error?.message || 'Não foi possível salvar. Tente novamente.';
    } finally {
      this.salvandoNovo = false;
    }
  }


  // =====================================================
  // CONFIRMAR EXCLUSÃO
  // =====================================================

  confirmarExclusaoRenda(id: string) {
    this.idParaExcluir = id;
    this.mostrarConfirmacaoExclusao = true;
  }

  cancelarExclusaoRenda() {
    this.idParaExcluir = null;
    this.mostrarConfirmacaoExclusao = false;
  }

  async excluirInvestimentoConfirmado(): Promise<void> {
    if (!this.idParaExcluir) return;

    const id = this.idParaExcluir;
    this.excluindoId = id;
    this.cancelarExclusaoRenda();

    try {
      await this.rendasService.excluirRenda(id);
      this.rendas = this.rendas.filter(r => r.id !== id);
      this.atualizarSimulacao();
    } catch (error) {
      console.error('Erro ao excluir investimento:', error);
    } finally {
      this.excluindoId = null;
    }
  }


  // =====================================================
  // SIMULAÇÃO AUTOMÁTICA EM TEMPO REAL
  // =====================================================

  private iniciarSimulacao(): void {
    this.pararSimulacao();
    if (!this.rendas || this.rendas.length === 0) return;

    this.intervaloSimulacao = setInterval(() => {
      this.atualizarSimulacao();
    }, this.INTERVALO_SIMULACAO);
  }

  private pararSimulacao(): void {
    if (this.intervaloSimulacao !== null) {
      clearInterval(this.intervaloSimulacao);
      this.intervaloSimulacao = null;
    }
  }

  private atualizarSimulacao(): void {
    if (!this.rendas || this.rendas.length === 0) {
      this.total = 0;
      return;
    }

    let novoTotal = 0;

    for (const renda of this.rendas) {
      const valor = parseNum(renda.valor_investido);
      const taxa = parseNum(renda.percentual_rendimento);

      renda.valor_investido = valor;
      renda.percentual_rendimento = taxa;

      if (valor <= 0) {
        renda.rendimento = 0;
        renda.saldo_atual = 0;
        continue;
      }

      if (taxa <= 0) {
        renda.rendimento = 0;
        renda.saldo_atual = valor;
        novoTotal += valor;
        continue;
      }

      const dataInicio = this.converterData(renda.data_recebimento);
      const agora = new Date();
      const diferencaMs = agora.getTime() - dataInicio.getTime();
      const tempoEmAnos = diferencaMs / (365.25 * 24 * 60 * 60 * 1000);

      let rendimento = 0;
      let saldoFinal = valor;

      if (tempoEmAnos > 0 && isFinite(tempoEmAnos)) {
        const taxaDecimal = taxa / 100;
        saldoFinal = valor * Math.pow(1 + taxaDecimal, tempoEmAnos);
        rendimento = saldoFinal - valor;

        if (!isFinite(rendimento) || rendimento < 0) rendimento = 0;
        if (!isFinite(saldoFinal) || saldoFinal < valor) saldoFinal = valor;
      }

      renda.rendimento = Number(rendimento.toFixed(2));
      renda.saldo_atual = Number(saldoFinal.toFixed(2));
      novoTotal += renda.saldo_atual;
    }

    this.total = Number(novoTotal.toFixed(2));
  }


  private converterData(data: string): Date {
    if (!data) return new Date();

    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      const partes = data.split('-');
      return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    }

    const resultado = new Date(data);
    return isNaN(resultado.getTime()) ? new Date() : resultado;
  }


  async voltar(): Promise<void> {
    await this.router.navigate(['/dashboard']);
  }

  async tentarNovamente(): Promise<void> {
    await this.listarRendas();
  }

  trackById(index: number, renda: Renda): string | number {
    return renda.id || index;
  }

}