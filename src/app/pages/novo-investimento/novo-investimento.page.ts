import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonInput,
  IonTextarea,
  IonIcon,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';

import { Router } from '@angular/router';

import { addIcons } from 'ionicons';

import {
  arrowBackOutline
} from 'ionicons/icons';

import { RendasService } from '../../services/rendas.service';


@Component({
  selector: 'app-novo-investimento',

  standalone: true,

  templateUrl: './novo-investimento.page.html',

  styleUrls: ['./novo-investimento.page.scss'],

  imports: [

    CommonModule,

    FormsModule,

    IonContent,

    IonInput,

    IonTextarea,

    IonIcon,

    IonSelect,

    IonSelectOption

  ]

})


export class NovoInvestimentoPage {


  titulo = '';

  tipo_investimento = '';

  valor_investido: number | null = null;

  percentual_rendimento: number | null = null;

  data_recebimento = '';

  descricao = '';

  salvando = false;


  // ==========================================
  // TÍTULOS
  // ==========================================

  titulosInvestimento = [

    'Meu primeiro investimento',

    'Reserva de emergência',

    'Investimento mensal',

    'Investimento de longo prazo',

    'Meu CDB',

    'Meu Tesouro Direto',

    'Minha LCI',

    'Minha LCA',

    'Minha Poupança'

  ];


  // ==========================================
  // TIPOS
  // ==========================================

  tiposInvestimento = [

    'CDB',

    'Tesouro Direto',

    'LCI',

    'LCA',

    'Poupança',

    'Fundo de Investimento',

    'Outro'

  ];


  constructor(

    private router: Router,

    private rendasService: RendasService

  ) {

    addIcons({

      arrowBackOutline

    });

  }


  // ==========================================
  // RENDIMENTO DA SIMULAÇÃO
  // ==========================================

  get rendimentoSimulado(): number {

    /*
     * Na criação do investimento, ele começa
     * em zero.
     */

    return 0;

  }


  // ==========================================
  // SALDO DA SIMULAÇÃO
  // ==========================================

  get saldoSimulado(): number {

    return Number(
      this.valor_investido || 0
    );

  }


  // ==========================================
  // SALVAR
  // ==========================================

  async salvarRenda() {


    console.log(
      'Iniciando salvamento...'
    );


    console.log(
      'Título:',
      this.titulo
    );


    console.log(
      'Tipo:',
      this.tipo_investimento
    );


    console.log(
      'Valor:',
      this.valor_investido
    );


    console.log(
      'Rentabilidade:',
      this.percentual_rendimento
    );


    console.log(
      'Data:',
      this.data_recebimento
    );


    // ========================================
    // VALIDAÇÃO
    // ========================================

    if (

      !this.titulo ||

      !this.tipo_investimento ||

      this.valor_investido === null ||

      this.valor_investido <= 0 ||

      this.percentual_rendimento === null ||

      this.percentual_rendimento < 0 ||

      !this.data_recebimento

    ) {

      alert(
        'Preencha todos os campos obrigatórios.'
      );

      return;

    }


    this.salvando = true;


    try {


      // ======================================
      // INVESTIMENTO
      // ======================================

      const investimento = {


        titulo:
          this.titulo,


        categoria:
          'Investimento',


        tipo_investimento:
          this.tipo_investimento,


        valor_investido:
          Number(
            this.valor_investido
          ),


        percentual_rendimento:
          Number(
            this.percentual_rendimento
          ),


        /*
         * Começa em zero.
         */

        rendimento:
          0,


        /*
         * Começa exatamente com
         * o valor investido.
         */

        saldo_atual:
          Number(
            this.valor_investido
          ),


        data_recebimento:
          this.data_recebimento,


        descricao:
          this.descricao || undefined

      };


      console.log(
        'Investimento enviado:',
        investimento
      );


      // ======================================
      // SALVAR
      // ======================================

      await this.rendasService.salvarRenda(
        investimento
      );


      alert(
        'Investimento cadastrado com sucesso!'
      );


      // ======================================
      // VOLTAR PARA RENDAS
      // ======================================

      await this.router.navigate([
        '/rendas'
      ]);

    }


    catch (error) {


      console.error(
        'Erro ao salvar investimento:',
        error
      );


      alert(
        'Não foi possível salvar o investimento.'
      );

    }


    finally {

      this.salvando = false;

    }

  }


  // ==========================================
  // VOLTAR
  // ==========================================

  voltar() {

    this.router.navigate([
      '/rendas'
    ]);

  }

}