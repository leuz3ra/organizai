import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
  alertCircleOutline,
  layersOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import { UserStorageService } from '../../services/user-storage.service';
import { formatBRL } from '../../utils/formatters';

@Component({
  selector: 'app-pagamentos',
  standalone: true,
  templateUrl: './pagamentos.page.html',
  styleUrls: ['./pagamentos.page.scss'],
  imports: [CommonModule, IonContent, IonIcon]
})
export class PagamentosPage implements OnInit {

  constructor(
    private router: Router,
    private userStorage: UserStorageService
  ) {
    addIcons({
      arrowBackOutline,
      tvOutline,
      documentTextOutline,
      homeOutline,
      arrowForwardOutline,
      cardOutline,
      trendingUpOutline,
      alertCircleOutline,
      layersOutline,
      chevronForwardOutline
    });
  }

  async ngOnInit() {
    await this.userStorage.carregarUsuarioAtual();
  }

  async ionViewWillEnter() {
    await this.userStorage.carregarUsuarioAtual();
  }

  private get listaBoletos(): any[] {
    try {
      const raw = this.userStorage.getItem('boletos');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  get totalAssinaturas(): number {
    try {
      const raw = this.userStorage.getItem('assinaturas');
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
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const fimDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

    return this.listaBoletos
      .filter((p: any) => {
        if (p.status === 'pago') return false;
        if (!p.vencimento) return true;
        const d = new Date(p.vencimento + 'T00:00:00');
        return d <= fimDoMes;
      })
      .reduce((s: number, p: any) => s + (Number(p.valor) || 0), 0);
  }

  get totalContasFixas(): number {
    try {
      const raw = this.userStorage.getItem('contas_fixas');
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

  get qtdParcelamentosAtivos(): number {
    const grupos = new Set<string>();
    this.listaBoletos
      .filter((b: any) => b.parcelado && b.grupoId && b.status !== 'pago')
      .forEach((b: any) => grupos.add(b.grupoId));
    return grupos.size;
  }

  get totalDividaParcelamentos(): number {
    return this.listaBoletos
      .filter((b: any) => b.parcelado && b.status !== 'pago')
      .reduce((s: number, b: any) => s + (Number(b.valor) || 0), 0);
  }

  get totalParcelasMes(): number {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const fimDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

    return this.listaBoletos
      .filter((b: any) => {
        if (!b.parcelado || b.status === 'pago') return false;
        if (!b.vencimento) return true;
        const d = new Date(b.vencimento + 'T00:00:00');
        return d <= fimDoMes;
      })
      .reduce((s: number, b: any) => s + (Number(b.valor) || 0), 0);
  }

  formatarMoeda(valor: number): string {
    return formatBRL(valor);
  }

  irParaAssinaturas()   { this.router.navigate(['/assinaturas']); }
  irParaBoletos()       { this.router.navigate(['/boletos']); }
  irParaParcelamentos() { this.router.navigate(['/boletos'], { queryParams: { filtro: 'parcelado' } }); }
  irParaContasFixas()   { this.router.navigate(['/contas-fixas']); }
  voltar()              { this.router.navigate(['/dashboard']); }
}
