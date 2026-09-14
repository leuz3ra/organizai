import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, addOutline, closeOutline, trashOutline,
  documentTextOutline, checkmarkCircleOutline, ellipseOutline,
  calendarOutline, alertCircleOutline
} from 'ionicons/icons';

export type StatusBoleto = 'pendente' | 'pago' | 'vencido';

export interface Boleto {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: StatusBoleto;
  banco?: string;
  criadoEm: string;
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
  filtro: 'todos' | StatusBoleto = 'todos';
  mostrarModal = false;
  mostrarConfirmacao = false;
  idParaExcluir: string | null = null;
  erroForm = '';

  novaForm = { descricao: '', valor: null as number | null, vencimento: '', banco: '' };

  constructor(private router: Router) {
    addIcons({ arrowBackOutline, addOutline, closeOutline, trashOutline,
      documentTextOutline, checkmarkCircleOutline, ellipseOutline,
      calendarOutline, alertCircleOutline });
  }

  ngOnInit() { this.carregar(); this.atualizarVencidos(); }
  ionViewWillEnter() { this.carregar(); this.atualizarVencidos(); }

  carregar() {
    try {
      const raw = localStorage.getItem('organizai_boletos');
      this.boletos = raw ? JSON.parse(raw) : this.dadosIniciais();
    } catch { this.boletos = this.dadosIniciais(); }
  }

  salvarLS() { localStorage.setItem('organizai_boletos', JSON.stringify(this.boletos)); }

  dadosIniciais(): Boleto[] {
    return [];
  }

  atualizarVencidos() {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    let ch = false;
    this.boletos.forEach(b => {
      if (b.status === 'pendente' && new Date(b.vencimento + 'T00:00:00') < hoje) {
        b.status = 'vencido'; ch = true;
      }
    });
    if (ch) this.salvarLS();
  }

  get filtrados(): Boleto[] {
    const l = this.filtro === 'todos' ? this.boletos : this.boletos.filter(b => b.status === this.filtro);
    return l.sort((a, b) => {
      const o: Record<StatusBoleto, number> = { vencido: 0, pendente: 1, pago: 2 };
      return o[a.status] - o[b.status] || a.vencimento.localeCompare(b.vencimento);
    });
  }

  get totalEmAberto(): number { return this.boletos.filter(b => b.status !== 'pago').reduce((s,b) => s + b.valor, 0); }
  get totalPago(): number     { return this.boletos.filter(b => b.status === 'pago').reduce((s,b) => s + b.valor, 0); }
  get cnt(): Record<string, number> {
    return { todos: this.boletos.length, pendente: this.boletos.filter(b=>b.status==='pendente').length,
      pago: this.boletos.filter(b=>b.status==='pago').length, vencido: this.boletos.filter(b=>b.status==='vencido').length };
  }

  togglePago(b: Boleto) {
    if (b.status === 'pago') {
      const v = new Date(b.vencimento + 'T00:00:00'); const h = new Date(); h.setHours(0,0,0,0);
      b.status = v < h ? 'vencido' : 'pendente';
    } else { b.status = 'pago'; }
    this.salvarLS();
  }

  iniciarExcluir(id: string, e: Event) { e.stopPropagation(); this.idParaExcluir = id; this.mostrarConfirmacao = true; }
  confirmarExclusao() { if (this.idParaExcluir) { this.boletos = this.boletos.filter(b => b.id !== this.idParaExcluir); this.salvarLS(); } this.mostrarConfirmacao = false; this.idParaExcluir = null; }
  cancelarExclusao() { this.mostrarConfirmacao = false; this.idParaExcluir = null; }

  abrirModal() { this.novaForm = { descricao: '', valor: null, vencimento: this.fmt(new Date()), banco: '' }; this.erroForm = ''; this.mostrarModal = true; }
  fecharModal() { this.mostrarModal = false; }

  salvar() {
    this.erroForm = '';
    if (!this.novaForm.descricao?.trim()) { this.erroForm = 'Informe a descrição.'; return; }
    if (!this.novaForm.valor || this.novaForm.valor <= 0) { this.erroForm = 'Informe um valor válido.'; return; }
    if (!this.novaForm.vencimento) { this.erroForm = 'Informe o vencimento.'; return; }
    const h = new Date(); h.setHours(0,0,0,0);
    const v = new Date(this.novaForm.vencimento + 'T00:00:00');
    this.boletos.unshift({
      id: this.id(), descricao: this.novaForm.descricao.trim(),
      valor: Number(this.novaForm.valor), vencimento: this.novaForm.vencimento,
      status: v < h ? 'vencido' : 'pendente',
      banco: this.novaForm.banco?.trim() || undefined, criadoEm: new Date().toISOString()
    });
    this.salvarLS(); this.fecharModal();
  }

  getDias(data: string): number {
    const h = new Date(); h.setHours(0,0,0,0);
    return Math.ceil((new Date(data + 'T00:00:00').getTime() - h.getTime()) / 86400000);
  }

  getTextoVenc(b: Boleto): string {
    if (b.status === 'pago') return 'Pago ✓';
    const d = this.getDias(b.vencimento);
    if (d < 0)  return `Venceu há ${Math.abs(d)}d`;
    if (d === 0) return 'Vence hoje!';
    if (d === 1) return 'Amanhã';
    return `${d} dias`;
  }

  fmtMoeda(v: number): string { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  fmtData(d: string): string { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  private fmt(d: Date): string { return d.toISOString().split('T')[0]; }
  private id(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

  voltar() { this.router.navigate(['/pagamentos']); }
  setFiltro(f: 'todos' | StatusBoleto) { this.filtro = f; }
}
