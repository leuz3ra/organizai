import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  walletOutline,
  trendingUpOutline,
  pieChartOutline,
  bulbOutline,
  shieldCheckmarkOutline,
  calendarOutline,
  alertCircleOutline,
  addCircleOutline,
  flagOutline,
  createOutline,
  checkmarkOutline,
  closeOutline
} from 'ionicons/icons';
import { UserStorageService } from '../../services/user-storage.service';
import { MetasService } from '../../services/metas.service';

interface Vencimento {
  nome: string;
  valor: number;
  dias: number;
  tipo: 'boleto' | 'conta';
}

@Component({
  selector: 'app-visao-geral',
  standalone: true,
  templateUrl: './visao-geral.page.html',
  styleUrls: ['./visao-geral.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonIcon]
})
export class VisaoGeralPage implements OnInit {
  rendaMensal: number = 0;
  salarioInput: string = '';
  editandoSalario: boolean = false;

  totalAssinaturas: number = 0;
  totalContasFixas: number = 0;
  totalBoletosPendentes: number = 0;
  totalPoupadoMetas: number = 0;

  proximosVencimentos: Vencimento[] = [];

  constructor(
    private router: Router,
    private userStorage: UserStorageService,
    private metasService: MetasService
  ) {
    addIcons({
      arrowBackOutline,
      walletOutline,
      trendingUpOutline,
      pieChartOutline,
      bulbOutline,
      shieldCheckmarkOutline,
      calendarOutline,
      alertCircleOutline,
      addCircleOutline,
      flagOutline,
      createOutline,
      checkmarkOutline,
      closeOutline
    });
  }

  async ngOnInit() {
    await this.carregarDados();
  }

  async ionViewWillEnter() {
    await this.carregarDados();
  }

  async carregarDados() {
    await this.userStorage.carregarUsuarioAtual();

    // Carregar salário
    const renda = this.userStorage.getItem('renda_mensal');
    if (renda) {
      this.rendaMensal = parseFloat(renda);
      this.salarioInput = this.rendaMensal.toString();
      this.editandoSalario = false;
    } else {
      this.editandoSalario = true;
    }

    let assinaturas = [];
    let contas = [];
    let boletos = [];

    // Carregar Assinaturas
    try {
      assinaturas = JSON.parse(this.userStorage.getItem('assinaturas') || '[]');
      this.totalAssinaturas = assinaturas
        .filter((a: any) => a.status === 'ativo')
        .reduce((sum: number, a: any) => {
          let v = Number(a.valor);
          if (a.ciclo === 'anual') v = v / 12;
          if (a.ciclo === 'semanal') v = v * 4.33;
          return sum + v;
        }, 0);
    } catch { this.totalAssinaturas = 0; }

    // Carregar Contas Fixas
    try {
      contas = JSON.parse(this.userStorage.getItem('contas_fixas') || '[]');
      this.totalContasFixas = contas.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
    } catch { this.totalContasFixas = 0; }

    // Carregar Boletos
    try {
      boletos = JSON.parse(this.userStorage.getItem('boletos') || '[]');
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const fimDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

      this.totalBoletosPendentes = boletos
        .filter((b: any) => {
          if (b.status === 'pago') return false;
          if (!b.vencimento) return true;
          const d = new Date(b.vencimento + 'T00:00:00');
          return d <= fimDoMes;
        })
        .reduce((sum: number, b: any) => sum + Number(b.valor), 0);
    } catch { this.totalBoletosPendentes = 0; }

    // Carregar total guardado em Metas via Supabase
    try {
      const [metas, pagamentos] = await Promise.all([
        this.metasService.listarMetas(),
        this.metasService.listarTodosPagamentosUsuario()
      ]);

      let totalGuardado = 0;
      for (const m of metas) {
        const pagos = pagamentos.filter(p => p.meta_id === m.id && p.pago).length;
        totalGuardado += (pagos * (m.valor_por_periodo || 0));
      }
      this.totalPoupadoMetas = totalGuardado;
    } catch {
      this.totalPoupadoMetas = 0;
    }

    this.calcularProximosVencimentos(contas, boletos);
  }

  calcularProximosVencimentos(contas: any[], boletos: any[]) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const lista: Vencimento[] = [];

    // Contas Fixas
    contas.filter(c => c.status === 'pendente').forEach(c => {
      const dia = c.diaVencimento;
      let d = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
      if (d <= hoje) d = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
      const dias = Math.ceil((d.getTime() - hoje.getTime()) / 86400000);
      lista.push({ nome: c.descricao, valor: c.valor, dias, tipo: 'conta' });
    });

    // Boletos
    boletos.filter(b => b.status === 'pendente' || b.status === 'vencido').forEach(b => {
      const partes = b.vencimento.split('/');
      let dias = 0;
      if (partes.length === 3) {
        const d = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
        dias = Math.ceil((d.getTime() - hoje.getTime()) / 86400000);
      } else {
        const d = new Date(b.vencimento);
        dias = Math.ceil((d.getTime() - hoje.getTime()) / 86400000);
      }
      lista.push({ nome: b.descricao, valor: b.valor, dias, tipo: 'boleto' });
    });

    lista.sort((a, b) => a.dias - b.dias);
    this.proximosVencimentos = lista.slice(0, 3);
  }

  salvarSalario() {
    const val = parseFloat(this.salarioInput);
    if (!isNaN(val) && val >= 0) {
      this.rendaMensal = val;
      this.userStorage.setItem('renda_mensal', val.toString());
      this.editandoSalario = false;
    }
  }

  get totalGastos(): number {
    return this.totalAssinaturas + this.totalContasFixas + this.totalBoletosPendentes;
  }

  get saldoRestante(): number {
    return this.rendaMensal - this.totalGastos;
  }

  get percentualComprometido(): number {
    if (this.rendaMensal === 0) return this.totalGastos > 0 ? 100 : 0;
    return Math.min(Math.round((this.totalGastos / this.rendaMensal) * 100), 100);
  }

  get percentualLivre(): number {
    if (this.rendaMensal <= 0) return 0;
    return Math.max(0, Math.round((this.saldoRestante / this.rendaMensal) * 100));
  }

  get percentualContasFixas(): number {
    if (this.rendaMensal <= 0) return 0;
    return Math.min(100, Math.round((this.totalContasFixas / this.rendaMensal) * 100));
  }

  get percentualBoletos(): number {
    if (this.rendaMensal <= 0) return 0;
    return Math.min(100, Math.round((this.totalBoletosPendentes / this.rendaMensal) * 100));
  }

  get percentualAssinaturas(): number {
    if (this.rendaMensal <= 0) return 0;
    return Math.min(100, Math.round((this.totalAssinaturas / this.rendaMensal) * 100));
  }

  // Gradiente cônico para o gráfico Donut financeiro
  get donutGradient(): string {
    const total = this.totalGastos;
    if (this.rendaMensal <= 0) {
      return 'conic-gradient(#D93025 0% 100%)';
    }

    const base = Math.max(this.rendaMensal, total);
    const pLivre = Math.max(0, (this.saldoRestante / base) * 100);
    const pContas = (this.totalContasFixas / base) * 100;
    const pBoletos = (this.totalBoletosPendentes / base) * 100;
    const pAssin = (this.totalAssinaturas / base) * 100;

    const stop1 = Number(pLivre.toFixed(1));
    const stop2 = Number((stop1 + pContas).toFixed(1));
    const stop3 = Number((stop2 + pBoletos).toFixed(1));

    return `conic-gradient(
      #1E5C3A 0% ${stop1}%,
      #F59E0B ${stop1}% ${stop2}%,
      #D93025 ${stop2}% ${stop3}%,
      #7C3AED ${stop3}% 100%
    )`;
  }

  // Regra 50-30-20
  get regraNecessidades() { return this.rendaMensal * 0.50; }
  get regraDesejos() { return this.rendaMensal * 0.30; }
  get regraFuturo() { return this.rendaMensal * 0.20; }

  // Reserva de Emergência (6 meses de contas fixas e assinaturas)
  get metaReservaEmergencia() {
    return (this.totalContasFixas + this.totalAssinaturas) * 6;
  }

  fmt(v: number): string {
    return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  voltar() {
    this.router.navigate(['/dashboard']);
  }
}
