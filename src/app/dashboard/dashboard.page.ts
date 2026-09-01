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
  sparklesOutline
} from 'ionicons/icons';

import { SupabaseService } from '../services/supabase.service';

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
  // CALCULADORA DE PERCENTUAL ROBUSTA E EM TEMPO REAL
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
    private supabaseService: SupabaseService
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
      sparklesOutline
    });
  }

  async ngOnInit() {
    await this.carregarUsuario();
  }

  async ionViewWillEnter() {
    await this.carregarUsuario();
  }


  // =====================================================
  // CARREGAR USUÁRIO CADASTRADO E MONTAR SAUDAÇÃO
  // =====================================================

  async carregarUsuario() {
    try {
      const user = await this.supabaseService.usuarioAtual();
      if (user) {
        // Busca o nome do metadata do cadastro
        const nomeCompleto =
          user.user_metadata?.['nome'] ||
          user.user_metadata?.['full_name'] ||
          user.user_metadata?.['name'] ||
          '';

        if (nomeCompleto && nomeCompleto.trim()) {
          // Extrai o primeiro nome capitalizado
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
  // MÉTODOS DO CONVERSOR
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
  // CALCULADORA DE PERCENTUAL (CÁLCULO EXATO & INSTANTÂNEO)
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

  abrirRendas() {
    this.router.navigate(['/rendas']);
  }

  abrirMetas() {
    this.router.navigate(['/metas']);
  }

  abrirPagamentos() {
    alert('Tela de Pagamentos em desenvolvimento.');
  }

  abrirDicas() {
    alert('Tela de Dicas em desenvolvimento.');
  }

}
