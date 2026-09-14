import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  tvOutline,
  documentTextOutline,
  homeOutline,
  arrowForwardOutline,
  cardOutline,
  trendingUpOutline,
  alertCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-pagamentos',
  standalone: true,
  templateUrl: './pagamentos.page.html',
  styleUrls: ['./pagamentos.page.scss'],
  imports: [CommonModule, IonContent, IonIcon]
})
export class PagamentosPage {

  constructor(private router: Router) {
    addIcons({
      arrowBackOutline,
      tvOutline,
      documentTextOutline,
      homeOutline,
      arrowForwardOutline,
      cardOutline,
      trendingUpOutline,
      alertCircleOutline
    });
  }

  get totalAssinaturas(): number {
    try {
      const raw = localStorage.getItem('organizai_assinaturas');
      if (!raw) return 0;
      const lista = JSON.parse(raw);
      return lista
        .filter((a: any) => a.status === 'ativo')
        .reduce((s: number, a: any) => {
          const v = Number(a.valor) || 0;
          return s + (a.ciclo === 'anual' ? v / 12 : v);
        }, 0);
    } catch { return 0; }
  }

  get totalBoletos(): number {
    try {
      const raw = localStorage.getItem('organizai_boletos');
      if (!raw) return 0;
      const lista = JSON.parse(raw);
      return lista
        .filter((p: any) => p.status !== 'pago')
        .reduce((s: number, p: any) => s + (Number(p.valor) || 0), 0);
    } catch { return 0; }
  }

  get totalContasFixas(): number {
    try {
      const raw = localStorage.getItem('organizai_contas_fixas');
      if (!raw) return 0;
      const lista = JSON.parse(raw);
      return lista
        .filter((c: any) => c.status !== 'pago')
        .reduce((s: number, c: any) => s + (Number(c.valor) || 0), 0);
    } catch { return 0; }
  }

  get totalGeral(): number {
    return this.totalAssinaturas + this.totalBoletos + this.totalContasFixas;
  }

  formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  irParaAssinaturas() { this.router.navigate(['/assinaturas']); }
  irParaBoletos()     { this.router.navigate(['/boletos']); }
  irParaContasFixas() { this.router.navigate(['/contas-fixas']); }
  voltar()            { this.router.navigate(['/dashboard']); }
}
