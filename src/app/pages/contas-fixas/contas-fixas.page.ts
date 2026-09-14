import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, addOutline, closeOutline, trashOutline,
  homeOutline, checkmarkCircleOutline, ellipseOutline,
  waterOutline, flashOutline, wifiOutline, carOutline,
  calendarOutline, refreshOutline, cartOutline, carSportOutline,
  busOutline, medkitOutline, appsOutline
} from 'ionicons/icons';

export type CatCF = 'moradia' | 'agua' | 'energia' | 'internet' | 'transporte' | 'saude' | 'mercado' | 'combustivel' | 'outros';
export type StatusCF = 'pago' | 'pendente';

export interface ContaFixa {
  id: string;
  descricao: string;
  valor: number;
  diaVencimento: number;
  categoria: CatCF;
  status: StatusCF;
  criadoEm: string;
}

@Component({
  selector: 'app-contas-fixas',
  standalone: true,
  templateUrl: './contas-fixas.page.html',
  styleUrls: ['./contas-fixas.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonIcon]
})
export class ContasFixasPage implements OnInit {

  contas: ContaFixa[] = [];
  mostrarModal = false;
  mostrarConfirmacao = false;
  idParaExcluir: string | null = null;
  erroForm = '';

  readonly categorias: { valor: CatCF; label: string; icon: string; cor: string }[] = [
    { valor: 'moradia',    label: 'Moradia / Aluguel',  icon: 'home-outline',        cor: '#7C3AED' },
    { valor: 'agua',       label: 'Água / Esgoto',      icon: 'water-outline',       cor: '#0EA5E9' },
    { valor: 'energia',    label: 'Energia Elétrica',   icon: 'flash-outline',       cor: '#F59E0B' },
    { valor: 'internet',   label: 'Internet / TV',      icon: 'wifi-outline',        cor: '#10B981' },
    { valor: 'transporte', label: 'Transporte',         icon: 'bus-outline',         cor: '#6366F1' },
    { valor: 'combustivel',label: 'Combustível',        icon: 'car-sport-outline',   cor: '#F43F5E' },
    { valor: 'mercado',    label: 'Mercado',            icon: 'cart-outline',        cor: '#14B8A6' },
    { valor: 'saude',      label: 'Saúde / Plano',      icon: 'medkit-outline',      cor: '#EF4444' },
    { valor: 'outros',     label: 'Outros',             icon: 'apps-outline',        cor: '#6B7280' },
  ];

  novaForm = { descricao: '', valor: null as number | null, diaVencimento: 1, categoria: 'outros' as CatCF };

  constructor(private router: Router) {
    addIcons({ arrowBackOutline, addOutline, closeOutline, trashOutline,
      homeOutline, checkmarkCircleOutline, ellipseOutline,
      waterOutline, flashOutline, wifiOutline, carOutline,
      calendarOutline, refreshOutline, cartOutline, carSportOutline,
      busOutline, medkitOutline, appsOutline });
  }

  ngOnInit() { this.carregar(); }
  ionViewWillEnter() { this.carregar(); }

  carregar() {
    try {
      const raw = localStorage.getItem('organizai_contas_fixas');
      this.contas = raw ? JSON.parse(raw) : this.dadosIniciais();
    } catch { this.contas = this.dadosIniciais(); }
  }

  salvarLS() { localStorage.setItem('organizai_contas_fixas', JSON.stringify(this.contas)); }

  dadosIniciais(): ContaFixa[] {
    return [];
  }

  get totalMensal(): number { return this.contas.reduce((s, c) => s + c.valor, 0); }
  get totalEmAberto(): number { return this.contas.filter(c => c.status === 'pendente').reduce((s, c) => s + c.valor, 0); }
  get totalPago(): number { return this.contas.filter(c => c.status === 'pago').reduce((s, c) => s + c.valor, 0); }
  get contPagas(): number { return this.contas.filter(c => c.status === 'pago').length; }
  get progresso(): number {
    if (!this.contas.length) return 0;
    return Math.round((this.contPagas / this.contas.length) * 100);
  }

  getCatInfo(cat: CatCF) { return this.categorias.find(c => c.valor === cat) || this.categorias[this.categorias.length - 1]; }

  togglePago(c: ContaFixa) { c.status = c.status === 'pago' ? 'pendente' : 'pago'; this.salvarLS(); }

  getDiasParaVencer(c: ContaFixa): number {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const dia = c.diaVencimento;
    let d = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
    if (d <= hoje) d = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
    return Math.ceil((d.getTime() - hoje.getTime()) / 86400000);
  }

  getProximoVenc(c: ContaFixa): string {
    const hoje = new Date();
    const dia = c.diaVencimento;
    let d = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
    if (d <= hoje) d = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  resetarMes() {
    this.contas.forEach(c => c.status = 'pendente');
    this.salvarLS();
  }

  iniciarExcluir(id: string, e: Event) { e.stopPropagation(); this.idParaExcluir = id; this.mostrarConfirmacao = true; }
  confirmarExclusao() { if (this.idParaExcluir) { this.contas = this.contas.filter(c => c.id !== this.idParaExcluir); this.salvarLS(); } this.mostrarConfirmacao = false; this.idParaExcluir = null; }
  cancelarExclusao() { this.mostrarConfirmacao = false; this.idParaExcluir = null; }

  abrirModal() { this.novaForm = { descricao: '', valor: null, diaVencimento: 1, categoria: 'outros' }; this.erroForm = ''; this.mostrarModal = true; }
  fecharModal() { this.mostrarModal = false; }

  salvar() {
    this.erroForm = '';
    if (!this.novaForm.descricao?.trim()) { this.erroForm = 'Informe a descrição.'; return; }
    if (!this.novaForm.valor || this.novaForm.valor <= 0) { this.erroForm = 'Informe um valor válido.'; return; }
    this.contas.push({
      id: this.id(), descricao: this.novaForm.descricao.trim(),
      valor: Number(this.novaForm.valor),
      diaVencimento: Number(this.novaForm.diaVencimento) || 1,
      categoria: this.novaForm.categoria, status: 'pendente',
      criadoEm: new Date().toISOString()
    });
    this.contas.sort((a, b) => a.diaVencimento - b.diaVencimento);
    this.salvarLS(); this.fecharModal();
  }

  fmt(v: number): string { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  private id(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
  voltar() { this.router.navigate(['/pagamentos']); }
}
