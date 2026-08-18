import { Injectable } from '@angular/core';

import { SupabaseService } from './supabase.service';

import { Renda } from '../models/renda.model';


@Injectable({
  providedIn: 'root'
})


export class RendasService {


  constructor(
    private supabaseService: SupabaseService
  ) {}


  // =====================================================
  // LISTAR INVESTIMENTOS DO USUÁRIO
  // =====================================================

  async listarRendas(): Promise<Renda[]> {

    const {
      data: { user },
      error: userError
    } =
      await this.supabaseService.supabase.auth.getUser();


    if (userError) {

      console.error(
        'Erro ao obter usuário:',
        userError
      );

      throw userError;

    }


    if (!user) {

      throw new Error(
        'Usuário não está autenticado no Supabase.'
      );

    }


    const {
      data,
      error
    } =
      await this.supabaseService.supabase

        .from('rendas')

        .select('*')

        .eq(
          'user_id',
          user.id
        )

        .order(
          'created_at',
          {
            ascending: false
          }
        );


    if (error) {

      console.error(
        'Erro ao listar investimentos:',
        error
      );

      throw error;

    }


    /*
     * Converte os valores que vêm do Supabase
     * para números reais.
     *
     * Isso evita o problema de aparecer somente
     * "R$" quando o valor vem como texto.
     */

    const investimentos =
      (data || []).map(
        (item: any) => {

          return {

            ...item,

            valor_investido:
              this.converterNumero(
                item.valor_investido
              ),

            percentual_rendimento:
              this.converterNumero(
                item.percentual_rendimento
              ),

            rendimento:
              this.converterNumero(
                item.rendimento
              ),

            saldo_atual:
              this.converterNumero(
                item.saldo_atual
              )

          } as Renda;

        }
      );


    return investimentos;

  }


  // =====================================================
  // SALVAR NOVO INVESTIMENTO
  // =====================================================

  async salvarRenda(
    renda: Renda
  ): Promise<Renda> {


    const {
      data: { user },
      error: userError
    } =
      await this.supabaseService.supabase.auth.getUser();


    if (userError) {

      console.error(
        'Erro ao obter usuário:',
        userError
      );

      throw userError;

    }


    if (!user) {

      throw new Error(
        'Usuário não está autenticado no Supabase.'
      );

    }


    // ===================================================
    // VALORES
    // ===================================================

    const valorInvestido =
      this.converterNumero(
        renda.valor_investido
      );


    const percentual =
      this.converterNumero(
        renda.percentual_rendimento
      );


    /*
     * Um investimento recém-criado deve começar
     * com rendimento praticamente zero.
     *
     * O cálculo completo será feito pela página
     * de investimentos usando a data da aplicação.
     */

    const rendimentoInicial = 0;


    const saldoInicial =
      valorInvestido;


    // ===================================================
    // DADOS PARA O SUPABASE
    // ===================================================

    const investimento = {

      titulo:
        renda.titulo,


      categoria:
        renda.categoria || 'Investimento',


      tipo_investimento:
        renda.tipo_investimento,


      valor_investido:
        valorInvestido,


      percentual_rendimento:
        percentual,


      rendimento:
        rendimentoInicial,


      saldo_atual:
        saldoInicial,


      data_recebimento:
        renda.data_recebimento,


      descricao:
        renda.descricao || null,


      user_id:
        user.id

    };


    console.log(
      'Dados enviados para o Supabase:',
      investimento
    );


    // ===================================================
    // INSERT
    // ===================================================

    const {
      data,
      error
    } =
      await this.supabaseService.supabase

        .from('rendas')

        .insert([
          investimento
        ])

        .select()

        .single();


    if (error) {

      console.error(
        'Erro ao salvar investimento:',
        error
      );

      throw error;

    }


    /*
     * Retorna os dados já normalizados.
     */

    return {

      ...data,

      valor_investido:
        this.converterNumero(
          data.valor_investido
        ),

      percentual_rendimento:
        this.converterNumero(
          data.percentual_rendimento
        ),

      rendimento:
        this.converterNumero(
          data.rendimento
        ),

      saldo_atual:
        this.converterNumero(
          data.saldo_atual
        )

    } as Renda;

  }


  // =====================================================
  // EDITAR INVESTIMENTO
  // =====================================================

  async editarRenda(
    id: string,
    renda: Partial<Renda>
  ): Promise<Renda> {


    const {
      data,
      error
    } =
      await this.supabaseService.supabase

        .from('rendas')

        .update(renda)

        .eq(
          'id',
          id
        )

        .select()

        .single();


    if (error) {

      console.error(
        'Erro ao editar investimento:',
        error
      );

      throw error;

    }


    return {

      ...data,

      valor_investido:
        this.converterNumero(
          data.valor_investido
        ),

      percentual_rendimento:
        this.converterNumero(
          data.percentual_rendimento
        ),

      rendimento:
        this.converterNumero(
          data.rendimento
        ),

      saldo_atual:
        this.converterNumero(
          data.saldo_atual
        )

    } as Renda;

  }


  // =====================================================
  // EXCLUIR INVESTIMENTO
  // =====================================================

  async excluirRenda(
    id: string
  ): Promise<void> {


    const {
      error
    } =
      await this.supabaseService.supabase

        .from('rendas')

        .delete()

        .eq(
          'id',
          id
        );


    if (error) {

      console.error(
        'Erro ao excluir investimento:',
        error
      );

      throw error;

    }

  }


  // =====================================================
  // CONVERTER VALOR PARA NUMBER
  // =====================================================

  private converterNumero(
    valor: any
  ): number {


    if (
      valor === null ||
      valor === undefined ||
      valor === ''
    ) {

      return 0;

    }


    if (
      typeof valor === 'number'
    ) {

      return isNaN(valor)
        ? 0
        : valor;

    }


    let texto =
      String(valor)
        .trim()
        .replace(/\s/g, '');


    /*
     * Remove R$
     */

    texto =
      texto
        .replace(
          /R\$/gi,
          ''
        )
        .trim();


    /*
     * 1.500,50
     * ↓
     * 1500.50
     */

    if (
      texto.includes('.') &&
      texto.includes(',')
    ) {

      texto =
        texto
          .replace(
            /\./g,
            ''
          )
          .replace(
            ',',
            '.'
          );

    }

    /*
     * 1500,50
     * ↓
     * 1500.50
     */

    else if (
      texto.includes(',')
    ) {

      texto =
        texto.replace(
          ',',
          '.'
        );

    }


    const numero =
      parseFloat(texto);


    return isNaN(numero)
      ? 0
      : numero;

  }

}