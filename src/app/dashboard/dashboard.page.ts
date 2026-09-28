import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  logOutOutline,
  notificationsOutline,
  personCircleOutline,
  swapHorizontal,
  arrowForward,
  arrowForwardOutline,
  addOutline,
  removeOutline,
  calculatorOutline,
  walletOutline,
  flagOutline,
  cardOutline,
  bulbOutline,
  closeOutline,
  checkmarkOutline,
  chevronDownOutline,
  searchOutline,
  pieChartOutline,
  sparklesOutline,
  settingsOutline,
  moon,
  sunny,
  eye,
  eyeOff,
  eyeOutline,
  eyeOffOutline,
  notifications,
  notificationsOff,
  alertCircleOutline,
  trendingUpOutline,
  addCircleOutline,
  calendarOutline,
  shieldCheckmarkOutline,
  timeOutline
} from 'ionicons/icons';

import { SupabaseService } from '../services/supabase.service';
import { UserStorageService } from '../services/user-storage.service';
import { MetasService } from '../services/metas.service';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export interface MoedaInfo {
  codigo: string;
  nome: string;
  pais: string;
  simbolo: string;
  bandeiraImg: string;
  cor: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon
  ]
})
export class DashboardPage implements OnInit {

  saudacao: string = 'Olá!';
  nomeUsuario: string = '';

  // =====================================================
  // RESUMO FINANCEIRO EM TEMPO REAL
  // =====================================================
  ocultarValores = false;
  rendaMensal = 0;
  totalAPagar = 0;
  totalBoletosPendentes = 0;
  totalContasFixasPendentes = 0;
  saldoLivre = 0;
  qtdBoletosAbertos = 0;
  qtdContasAbertas = 0;

  alertaVencimento: {
    mensagem: string;
    tipo: 'perigo' | 'alerta' | 'sucesso' | 'ok';
    dias?: number;
  } | null = null;

  metasPoupadoTotal = 0;
  metasObjetivoTotal = 0;
  metasProgressoPct = 0;
  totalMetasAtivas = 0;

  ferramentaAtiva: 'conversor' | 'calculadora' = 'conversor';

  // =====================================================
  // CONFIGURAÇÕES GERAIS E NOTIFICAÇÕES
  // =====================================================
  darkModeAtivo = false;
  mostrarConfiguracoes = false;
  mostrarNotificacoes = false;

  // =====================================================
  // CONVERSOR DE MOEDAS COM BANDEIRAS REAIS
  // =====================================================
  valorBRL: number | null = null;
  valorUSD: number | null = null;

  moedaOrigem = 'BRL';
  moedaDestino = 'USD';

  mostrarModalMoeda = false;
  tipoMoedaSelecionando: 'origem' | 'destino' = 'origem';

  readonly moedas: MoedaInfo[] = [
    {
      codigo: 'BRL',
      nome: 'Real Brasileiro',
      pais: 'Brasil',
      simbolo: 'R$',
      bandeiraImg: 'assets/bandeiras/br.png',
      cor: '#1E5C3A'
    },
    {
      codigo: 'USD',
      nome: 'Dólar Americano',
      pais: 'Estados Unidos',
      simbolo: 'US$',
      bandeiraImg: 'assets/bandeiras/us.png',
      cor: '#2563EB'
    },
    {
      codigo: 'EUR',
      nome: 'Euro Europeu',
      pais: 'União Europeia',
      simbolo: '€',
      bandeiraImg: 'assets/bandeiras/eu.png',
      cor: '#003399'
    },
    {
      codigo: 'GBP',
      nome: 'Libra Esterlina',
      pais: 'Reino Unido',
      simbolo: '£',
      bandeiraImg: 'assets/bandeiras/gb.png',
      cor: '#CF142B'
    },
    {
      codigo: 'JPY',
      nome: 'Iene Japonês',
      pais: 'Japão',
      simbolo: '¥',
      bandeiraImg: 'assets/bandeiras/jp.png',
      cor: '#BC002D'
    }
  ];

  private readonly taxasEmBRL: Record<string, number> = {
    BRL: 1,
    USD: 5.50,
    EUR: 6.20,
    GBP: 7.30,
    JPY: 0.038
  };

  // =====================================================
  // CALCULADORA DE PERCENTUAL
  // =====================================================
  valorInicial: number | null = null;
  percentual: number | null = null;
  resultado: number | null = null;
  valorParcela: number | null = null;
  modoCalc: 'somar' | 'subtrair' | 'apenas' = 'somar';

  // =====================================================
  // MODAL LOGOUT
  // =====================================================
  mostrarLogout = false;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private userStorage: UserStorageService,
    private metasService: MetasService
  ) {
    addIcons({
      logOutOutline,
      notificationsOutline,
      personCircleOutline,
      swapHorizontal,
      arrowForward,
      arrowForwardOutline,
      addOutline,
      removeOutline,
      calculatorOutline,
      walletOutline,
      flagOutline,
      cardOutline,
      bulbOutline,
      closeOutline,
      checkmarkOutline,
      chevronDownOutline,
      searchOutline,
      pieChartOutline,
      sparklesOutline,
      settingsOutline,
      moon,
      sunny,
      eye,
      eyeOff,
      eyeOutline,
      eyeOffOutline,
      notifications,
      notificationsOff,
      alertCircleOutline,
      trendingUpOutline,
      addCircleOutline,
      calendarOutline,
      shieldCheckmarkOutline,
      timeOutline
    });
  }

  async ngOnInit() {
    this.carregarTemaEscuro();
    this.carregarPreferenciaPrivacidade();
    await this.carregarUsuario();
    await this.carregarResumoFinanceiro();
  }

  async ionViewWillEnter() {
    this.carregarTemaEscuro();
    this.carregarPreferenciaPrivacidade();
    await this.carregarUsuario();
    await this.carregarResumoFinanceiro();
  }

  // =====================================================
  // CARREGAR RESUMO FINANCEIRO
  // =====================================================
  async carregarResumoFinanceiro() {
    await this.userStorage.carregarUsuarioAtual();

    // 1. Renda
    const renda = this.userStorage.getItem('renda_mensal');
    this.rendaMensal = renda ? parseFloat(renda) : 0;

    // 2. Boletos
    let boletos: any[] = [];
    try {
      boletos = JSON.parse(this.userStorage.getItem('boletos') || '[]');
    } catch { boletos = []; }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const fimDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

    const boletosPendentes = boletos.filter((b: any) => {
      if (b.status === 'pago') return false;
      if (!b.vencimento) return true;
      const d = new Date(b.vencimento + 'T00:00:00');
      return d <= fimDoMes;
    });
    this.qtdBoletosAbertos = boletosPendentes.length;
    this.totalBoletosPendentes = boletosPendentes.reduce((s: number, b: any) => s + (Number(b.valor) || 0), 0);

    // 3. Contas Fixas
    let contas: any[] = [];
    try {
      contas = JSON.parse(this.userStorage.getItem('contas_fixas') || '[]');
    } catch { contas = []; }

    const contasPendentes = contas.filter((c: any) => c.status !== 'pago');
    this.qtdContasAbertas = contasPendentes.length;
    this.totalContasFixasPendentes = contasPendentes.reduce((s: number, c: any) => s + (Number(c.valor) || 0), 0);

    // 4. Assinaturas
    let assinaturas: any[] = [];
    try {
      assinaturas = JSON.parse(this.userStorage.getItem('assinaturas') || '[]');
    } catch { assinaturas = []; }
    const totalAssinaturasAtivas = assinaturas
      .filter((a: any) => a.status === 'ativo')
      .reduce((s: number, a: any) => {
        let v = Number(a.valor) || 0;
        if (a.ciclo === 'anual') v = v / 12;
        if (a.ciclo === 'semanal') v = v * 4.33;
        return s + v;
      }, 0);

    // Total a pagar no mês
    this.totalAPagar = this.totalBoletosPendentes + this.totalContasFixasPendentes + totalAssinaturasAtivas;
    this.saldoLivre = this.rendaMensal - this.totalAPagar;

    // 5. Radar de Vencimentos
    this.calcularAlertaVencimento(boletosPendentes, contasPendentes);

    // 6. Metas do Supabase
    try {
      const [metas, pagamentos] = await Promise.all([
        this.metasService.listarMetas(),
        this.metasService.listarTodosPagamentosUsuario()
      ]);

      this.totalMetasAtivas = metas.length;
      let totalObj = 0;
      let totalPoup = 0;

      for (const m of metas) {
        totalObj += (m.valor_total || 0);
        const pagos = pagamentos.filter(p => p.meta_id === m.id && p.pago).length;
        totalPoup += (pagos * (m.valor_por_periodo || 0));
      }

      this.metasObjetivoTotal = totalObj;
      this.metasPoupadoTotal = totalPoup;
      this.metasProgressoPct = totalObj > 0 ? Math.min(100, Math.round((totalPoup / totalObj) * 100)) : 0;
    } catch {
      // Metas não configuradas ou erro silencioso
    }
  }

  calcularAlertaVencimento(boletos: any[], contas: any[]) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Checa se há boletos vencidos
    const vencidos = boletos.filter(b => {
      const d = new Date(b.vencimento + 'T00:00:00');
      return d < hoje;
    });

    if (vencidos.length > 0) {
      const soma = vencidos.reduce((s, b) => s + Number(b.valor || 0), 0);
      this.alertaVencimento = {
        mensagem: `${vencidos.length} ${vencidos.length === 1 ? 'conta vencida' : 'contas vencidas'} (${this.formatarMoeda(soma)})! Pague para evitar juros.`,
        tipo: 'perigo'
      };
      return;
    }

    // Checa se há contas vencendo hoje
    const vencemHoje = boletos.filter(b => {
      const d = new Date(b.vencimento + 'T00:00:00');
      return d.getTime() === hoje.getTime();
    });

    if (vencemHoje.length > 0) {
      this.alertaVencimento = {
        mensagem: `Atenção: ${vencemHoje[0].descricao} vence HOJE (${this.formatarMoeda(vencemHoje[0].valor)})!`,
        tipo: 'alerta'
      };
      return;
    }

    // Checa próximos vencimentos em até 3 dias
    const proximos: { nome: string; valor: number; dias: number }[] = [];

    boletos.forEach(b => {
      const d = new Date(b.vencimento + 'T00:00:00');
      const dias = Math.ceil((d.getTime() - hoje.getTime()) / 86400000);
      if (dias > 0 && dias <= 3) {
        proximos.push({ nome: b.descricao, valor: Number(b.valor), dias });
      }
    });

    contas.forEach(c => {
      let d = new Date(hoje.getFullYear(), hoje.getMonth(), c.diaVencimento);
      if (d <= hoje) d = new Date(hoje.getFullYear(), hoje.getMonth() + 1, c.diaVencimento);
      const dias = Math.ceil((d.getTime() - hoje.getTime()) / 86400000);
      if (dias > 0 && dias <= 3) {
        proximos.push({ nome: c.descricao, valor: Number(c.valor), dias });
      }
    });

    if (proximos.length > 0) {
      proximos.sort((a, b) => a.dias - b.dias);
      const prox = proximos[0];
      const txtDias = prox.dias === 1 ? 'amanhã' : `em ${prox.dias} dias`;
      this.alertaVencimento = {
        mensagem: `${prox.nome} (${this.formatarMoeda(prox.valor)}) vence ${txtDias}.`,
        tipo: 'alerta',
        dias: prox.dias
      };
      return;
    }

    if (this.totalAPagar > 0) {
      this.alertaVencimento = {
        mensagem: 'Tudo sob controle! Nenhum vencimento urgente nos próximos 3 dias.',
        tipo: 'sucesso'
      };
    } else {
      this.alertaVencimento = {
        mensagem: 'Nenhuma conta pendente para pagar este mês.',
        tipo: 'ok'
      };
    }
  }

  // =====================================================
  // PRIVACIDADE & FORMATAÇÃO
  // =====================================================
  toggleOcultarValores() {
    this.ocultarValores = !this.ocultarValores;
    localStorage.setItem('ocultarValores', this.ocultarValores ? 'true' : 'false');
  }

  carregarPreferenciaPrivacidade() {
    this.ocultarValores = localStorage.getItem('ocultarValores') === 'true';
  }

  formatarMoeda(valor: number): string {
    if (this.ocultarValores) {
      return 'R$ •••••';
    }
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // =====================================================
  // TEMA ESCURO
  // =====================================================
  carregarTemaEscuro() {
    const isDark = localStorage.getItem('temaEscuro') === 'true';
    this.darkModeAtivo = isDark;
    document.body.classList.toggle('dark-mode', isDark);
  }

  toggleDarkMode() {
    this.darkModeAtivo = !this.darkModeAtivo;
    document.body.classList.toggle('dark-mode', this.darkModeAtivo);
    localStorage.setItem('temaEscuro', this.darkModeAtivo ? 'true' : 'false');
    this.atualizarStatusBarStyle();
  }

  private async atualizarStatusBarStyle() {
    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.setStyle({
          style: this.darkModeAtivo ? Style.Dark : Style.Light
        });
      } catch (e) {}
    }
  }

  abrirConfiguracoes() {
    this.mostrarConfiguracoes = true;
  }

  fecharConfiguracoes() {
    this.mostrarConfiguracoes = false;
  }

  abrirNotificacoes() {
    this.mostrarNotificacoes = true;
  }

  fecharNotificacoes() {
    this.mostrarNotificacoes = false;
  }

  // =====================================================
  // USUÁRIO & SAUDAÇÃO
  // =====================================================
  async carregarUsuario() {
    try {
      const user = await this.supabaseService.usuarioAtual();
      if (user) {
        const nomeCompleto =
          user.user_metadata?.['nome'] ||
          user.user_metadata?.['full_name'] ||
          user.user_metadata?.['name'] ||
          '';

        if (nomeCompleto && nomeCompleto.trim()) {
          const primeiro = nomeCompleto.trim().split(' ')[0];
          this.nomeUsuario = primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
        } else if (user.email) {
          const prefixo = user.email.split('@')[0];
          this.nomeUsuario = prefixo.charAt(0).toUpperCase() + prefixo.slice(1);
        }
      }
    } catch (err) {
      console.error('Erro ao obter usuário autenticado:', err);
    } finally {
      this.definirSaudacao();
    }
  }

  definirSaudacao() {
    const hora = new Date().getHours();
    let cumprimento = 'Bom dia';

    if (hora >= 12 && hora < 18) {
      cumprimento = 'Boa tarde';
    } else if (hora >= 18 || hora < 5) {
      cumprimento = 'Boa noite';
    }

    if (this.nomeUsuario) {
      this.saudacao = `${cumprimento}, ${this.nomeUsuario}! 👋`;
    } else {
      this.saudacao = `${cumprimento}! 👋`;
    }
  }

  // =====================================================
  // CONVERSOR
  // =====================================================
  getMoeda(codigo: string): MoedaInfo {
    return this.moedas.find(m => m.codigo === codigo) || this.moedas[0];
  }

  converterBRL() {
    if (this.valorBRL === null || this.valorBRL === undefined || isNaN(this.valorBRL)) {
      this.valorUSD = null;
      return;
    }

    const taxaOrigem = this.taxasEmBRL[this.moedaOrigem] || 1;
    const taxaDestino = this.taxasEmBRL[this.moedaDestino] || 1;

    const valorBaseBRL = Number(this.valorBRL) * taxaOrigem;
    this.valorUSD = Number((valorBaseBRL / taxaDestino).toFixed(2));
  }

  inverterMoedas() {
    const tempMoeda = this.moedaOrigem;
    this.moedaOrigem = this.moedaDestino;
    this.moedaDestino = tempMoeda;

    const tempValor = this.valorBRL;
    this.valorBRL = this.valorUSD;
    this.valorUSD = tempValor;

    this.converterBRL();
  }

  abrirSeletorMoeda(tipo: 'origem' | 'destino') {
    this.tipoMoedaSelecionando = tipo;
    this.mostrarModalMoeda = true;
  }

  fecharSeletorMoeda() {
    this.mostrarModalMoeda = false;
  }

  selecionarMoeda(codigo: string) {
    if (this.tipoMoedaSelecionando === 'origem') {
      this.moedaOrigem = codigo;
    } else {
      this.moedaDestino = codigo;
    }

    this.fecharSeletorMoeda();
    this.converterBRL();
  }

  // =====================================================
  // CALCULADORA DE PERCENTUAL
  // =====================================================
  setModoCalc(modo: 'somar' | 'subtrair' | 'apenas') {
    this.modoCalc = modo;
    this.calcularPercentual();
  }

  calcularPercentual() {
    const val = Number(this.valorInicial);
    const pct = Number(this.percentual);

    if (
      this.valorInicial === null ||
      this.valorInicial === undefined ||
      isNaN(val) ||
      val <= 0 ||
      this.percentual === null ||
      this.percentual === undefined ||
      isNaN(pct) ||
      pct < 0
    ) {
      this.resultado = null;
      this.valorParcela = null;
      return;
    }

    const parcela = (val * pct) / 100;
    this.valorParcela = Number(parcela.toFixed(2));

    if (this.modoCalc === 'somar') {
      this.resultado = Number((val + parcela).toFixed(2));
    } else if (this.modoCalc === 'subtrair') {
      this.resultado = Number((val - parcela).toFixed(2));
    } else {
      this.resultado = Number(parcela.toFixed(2));
    }
  }

  // =====================================================
  // LOGOUT & NAVEGAÇÃO
  // =====================================================
  logout() {
    this.mostrarLogout = true;
  }

  async confirmarLogout() {
    this.mostrarLogout = false;
    try {
      await this.supabaseService.logout();
    } catch (e) {
      console.error('Erro ao deslogar:', e);
    }
    this.router.navigate(['/login']);
  }

  cancelarLogout() {
    this.mostrarLogout = false;
  }

  abrirVisaoGeral() {
    this.router.navigate(['/visao-geral']);
  }

  abrirMetas() {
    this.router.navigate(['/metas']);
  }

  abrirPagamentos() {
    this.router.navigate(['/pagamentos']);
  }

  abrirBoletos() {
    this.router.navigate(['/boletos']);
  }

  abrirContasFixas() {
    this.router.navigate(['/contas-fixas']);
  }

  abrirDicas() {
    this.router.navigate(['/dicas']);
  }
}
