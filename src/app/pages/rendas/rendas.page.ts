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
  refreshOutline
} from 'ionicons/icons';

import { RendasService } from '../../services/rendas.service';
import { Renda } from '../../models/renda.model';


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


export class RendasPage
  implements OnInit, OnDestroy {


  // =====================================================
  // DADOS
  // =====================================================

  rendas: Renda[] = [];

  total = 0;


  // =====================================================
  // ESTADOS
  // =====================================================

  carregando = false;

  erro = '';

  excluindoId: string | null = null;

  navegandoNovo = false;


  // =====================================================
  // CONTROLE DA SIMULAÇÃO
  // =====================================================

  private intervaloSimulacao: ReturnType<typeof setInterval> | null = null;


  /*
   * Atualizamos a simulação a cada 30 segundos.
   *
   * Não existe necessidade de recalcular os investimentos
   * a cada segundo.
   */

  private readonly INTERVALO_SIMULACAO = 30000;


  // =====================================================
  // CONSTRUTOR
  // =====================================================

  constructor(
    private router: Router,
    private rendasService: RendasService
  ) {

    addIcons({
      arrowBackOutline,
      addOutline,
      trashOutline,
      refreshOutline
    });

  }


  // =====================================================
  // INICIALIZAÇÃO
  // =====================================================

  ngOnInit(): void {

    this.listarRendas();

  }


  // =====================================================
  // DESTRUIÇÃO
  // =====================================================

  ngOnDestroy(): void {

    this.pararSimulacao();

  }


  // =====================================================
  // LISTAR INVESTIMENTOS
  // =====================================================

  async listarRendas(): Promise<void> {

    /*
     * Evita iniciar outra consulta enquanto uma
     * consulta já está acontecendo.
     */

    if (this.carregando) {
      return;
    }


    this.carregando = true;

    this.erro = '';


    try {

      const dados =
        await this.rendasService.listarRendas();


      console.log(
        'Investimentos recebidos:',
        dados
      );


      this.rendas = dados;


      this.atualizarSimulacao();


      this.iniciarSimulacao();


    } catch (error) {

      console.error(
        'Erro ao carregar investimentos:',
        error
      );


      this.erro =
        'Não foi possível carregar seus investimentos.';


    } finally {

      this.carregando = false;

    }

  }


  // =====================================================
  // INICIAR SIMULAÇÃO AUTOMÁTICA
  // =====================================================

  private iniciarSimulacao(): void {

    this.pararSimulacao();


    /*
     * Só cria o intervalo se existir pelo menos
     * um investimento.
     */

    if (this.rendas.length === 0) {
      return;
    }


    this.intervaloSimulacao =
      setInterval(() => {

        this.atualizarSimulacao();

      }, this.INTERVALO_SIMULACAO);

  }


  // =====================================================
  // PARAR SIMULAÇÃO
  // =====================================================

  private pararSimulacao(): void {

    if (
      this.intervaloSimulacao !== null
    ) {

      clearInterval(
        this.intervaloSimulacao
      );

      this.intervaloSimulacao = null;

    }

  }


  // =====================================================
  // ATUALIZAR SIMULAÇÃO
  // =====================================================

  private atualizarSimulacao(): void {

    if (this.rendas.length === 0) {

      this.total = 0;

      return;

    }


    let novoTotal = 0;


    for (
      const renda of this.rendas
    ) {


      const valor =
        Number(
          renda.valor_investido || 0
        );


      const taxa =
        Number(
          renda.percentual_rendimento || 0
        );


      /*
       * Sem valor investido.
       */

      if (valor <= 0) {

        renda.rendimento = 0;

        renda.saldo_atual = 0;

        continue;

      }


      /*
       * Sem rentabilidade.
       */

      if (taxa <= 0) {

        renda.rendimento = 0;

        renda.saldo_atual = valor;

        novoTotal += valor;

        continue;

      }


      /*
       * Data inicial.
       */

      const dataInicio =
        this.converterData(
          renda.data_recebimento
        );


      const agora =
        new Date();


      /*
       * Diferença em anos.
       */

      let tempoEmAnos =
        (
          agora.getTime()
          -
          dataInicio.getTime()
        )
        /
        (
          365.25 *
          24 *
          60 *
          60 *
          1000
        );


      /*
       * Data futura ou hoje.
       */

      if (tempoEmAnos <= 0) {

        renda.rendimento = 0;

        renda.saldo_atual = valor;

        novoTotal += valor;

        continue;

      }


      /*
       * Evita valores estranhos.
       */

      if (
        !isFinite(tempoEmAnos)
      ) {

        tempoEmAnos = 0;

      }


      /*
       * Taxa anual em decimal.
       */

      const taxaDecimal =
        taxa / 100;


      /*
       * JUROS COMPOSTOS
       *
       * M = C × (1 + i)^t
       */

      const saldo =
        valor *
        Math.pow(
          1 + taxaDecimal,
          tempoEmAnos
        );


      let rendimento =
        saldo - valor;


      /*
       * Proteções contra NaN
       * e valores negativos.
       */

      if (
        !isFinite(rendimento) ||
        rendimento < 0
      ) {

        rendimento = 0;

      }


      let saldoFinal =
        valor + rendimento;


      if (
        !isFinite(saldoFinal) ||
        saldoFinal < valor
      ) {

        saldoFinal = valor;

      }


      renda.rendimento =
        rendimento;


      renda.saldo_atual =
        saldoFinal;


      novoTotal +=
        saldoFinal;

    }


    this.total =
      novoTotal;

  }


  // =====================================================
  // CONVERSÃO DE DATA
  // =====================================================

  private converterData(
    data: string
  ): Date {


    if (!data) {

      return new Date();

    }


    /*
     * Data do banco:
     *
     * YYYY-MM-DD
     */

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(data)
    ) {


      const partes =
        data.split('-');


      const ano =
        Number(partes[0]);


      const mes =
        Number(partes[1]) - 1;


      const dia =
        Number(partes[2]);


      return new Date(
        ano,
        mes,
        dia
      );

    }


    const resultado =
      new Date(data);


    if (
      isNaN(
        resultado.getTime()
      )
    ) {

      return new Date();

    }


    return resultado;

  }


  // =====================================================
  // EXCLUIR INVESTIMENTO
  // =====================================================

  async excluirInvestimento(
    id: string
  ): Promise<void> {


    const confirmar =
      confirm(
        'Tem certeza que deseja excluir este investimento?'
      );


    if (!confirmar) {

      return;

    }


    /*
     * Ativa loading somente neste card.
     */

    this.excluindoId = id;


    try {


      await this.rendasService
        .excluirRenda(id);


      /*
       * Remove imediatamente da tela.
       *
       * Isso deixa a interface muito mais rápida,
       * sem precisar esperar uma nova consulta.
       */

      this.rendas =
        this.rendas.filter(
          renda =>
            renda.id !== id
        );


      this.atualizarSimulacao();


      alert(
        'Investimento excluído com sucesso!'
      );


    } catch (error) {


      console.error(
        'Erro ao excluir investimento:',
        error
      );


      alert(
        'Não foi possível excluir o investimento.'
      );


    } finally {

      this.excluindoId = null;

    }

  }


  // =====================================================
  // NOVO INVESTIMENTO
  // =====================================================

  async novoInvestimento(): Promise<void> {


    if (this.navegandoNovo) {
      return;
    }


    this.navegandoNovo = true;


    try {

      await this.router.navigate([
        '/novo-investimento'
      ]);

    } finally {

      this.navegandoNovo = false;

    }

  }


  // =====================================================
  // VOLTAR
  // =====================================================

  async voltar(): Promise<void> {

    await this.router.navigate([
      '/dashboard'
    ]);

  }

  // =====================================================
  // OTIMIZAÇÃO DOS CARDS
  // =====================================================

  trackById(
    index: number,
    renda: Renda
  ): string | number {

    return renda.id || index;

  }


  // =====================================================
  // TENTAR NOVAMENTE
  // =====================================================

  async tentarNovamente(): Promise<void> {

    await this.listarRendas();

  }

}