import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonContent, IonIcon]
})
export class PagamentosPage implements OnInit {

  // Propriedades calculadas e armazenadas (evita JSON.parse() a cada ciclo de detecção)
  totalAssinaturas = 0;
  totalBoletos = 0;
  totalContasFixas = 0;
  qtdParcelamentosAtivos = 0;
  totalDividaParcelamentos = 0;
  totalParcelasMes = 0;

  constructor(
    private router: Router,
    private userStorage: UserStorageService,
    private cdr: ChangeDetectorRef
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
    // Inicialização mínima — dados carregados em ionViewWillEnter
  }

  async ionViewWillEnter() {
    await this.userStorage.carregarUsuarioAtual();
    this.calcularTotais();
    this.cdr.markForCheck();
  }

  /**
   * Calcula todos os totais de uma vez, lendo o localStorage apenas uma vez por tela.
   * Antes: 5 getters faziam JSON.parse() individualmente a cada ciclo de detecção.
   */
  private calcularTotais(): void {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const fimDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

    // --- Assinaturas ---
    try {
      const raw = this.userStorage.getItem('assinaturas');
      const lista = raw ? JSON.parse(raw) : [];
      this.totalAssinaturas = lista
        .filter((a: any) => a.status === 'ativo')
        .reduce((s: number, a: any) => {
          const v = Number(a.valor) || 0;
          return s + (a.ciclo === 'anual' ? v / 12 : v);
        }, 0);
    } catch {
      this.totalAssinaturas = 0;
    }

    // --- Boletos (único JSON.parse para todos os cálculos relacionados) ---
    let boletos: any[] = [];
    try {
      const raw = this.userStorage.getItem('boletos');
      boletos = raw ? JSON.parse(raw) : [];
    } catch {
      boletos = [];
    }

    const boletosPendentesNoMes = boletos.filter((b: any) => {
      if (b.status === 'pago') return false;
      if (!b.vencimento) return true;
      const d = new Date(b.vencimento + 'T00:00:00');
      return d <= fimDoMes;
    });

    this.totalBoletos = boletosPendentesNoMes.reduce(
      (s: number, b: any) => s + (Number(b.valor) || 0), 0
    );

    // Parcelamentos
    const gruposMap = new Map<string, boolean>();
    let totalDivida = 0;
    let totalParcelasMes = 0;

    for (const b of boletos) {
      if (b.parcelado && b.grupoId && b.status !== 'pago') {
        gruposMap.set(b.grupoId, true);
        totalDivida += Number(b.valor) || 0;

        // Parcela no mês
        if (!b.vencimento) {
          totalParcelasMes += Number(b.valor) || 0;
        } else {
          const d = new Date(b.vencimento + 'T00:00:00');
          if (d <= fimDoMes) {
            totalParcelasMes += Number(b.valor) || 0;
          }
        }
      }
    }

    this.qtdParcelamentosAtivos = gruposMap.size;
    this.totalDividaParcelamentos = totalDivida;
    this.totalParcelasMes = totalParcelasMes;

    // --- Contas Fixas ---
    try {
      const raw = this.userStorage.getItem('contas_fixas');
      const lista = raw ? JSON.parse(raw) : [];
      this.totalContasFixas = lista
        .filter((c: any) => c.status !== 'pago')
        .reduce((s: number, c: any) => s + (Number(c.valor) || 0), 0);
    } catch {
      this.totalContasFixas = 0;
    }
  }

  get totalGeral(): number {
    return this.totalAssinaturas + this.totalBoletos + this.totalContasFixas;
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
