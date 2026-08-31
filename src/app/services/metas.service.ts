import { Injectable } from '@angular/core';

import { SupabaseService } from './supabase.service';

import { Meta, MetaPagamento } from '../models/meta.model';


@Injectable({
  providedIn: 'root'
})
export class MetasService {

  constructor(
    private supabaseService: SupabaseService
  ) {}


  // =====================================================
  // OBTER USUÁRIO ATUAL
  // =====================================================

  private async obterUsuario() {

    const {
      data: { user },
      error
    } = await this.supabaseService.supabase.auth.getUser();

    if (error || !user) {
      throw new Error('Usuário não está autenticado.');
    }

    return user;

  }


  // =====================================================
  // LISTAR METAS
  // =====================================================

  async listarMetas(): Promise<Meta[]> {

    const user = await this.obterUsuario();

    const { data, error } =
      await this.supabaseService.supabase
        .from('metas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar metas:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      ...item,
      valor_total: Number(item.valor_total),
      valor_por_periodo: Number(item.valor_por_periodo),
      total_periodos: Number(item.total_periodos)
    })) as Meta[];

  }


  // =====================================================
  // CRIAR META
  // =====================================================

  async criarMeta(meta: Omit<Meta, 'id' | 'user_id' | 'created_at'>): Promise<Meta> {

    const user = await this.obterUsuario();

    const { data, error } =
      await this.supabaseService.supabase
        .from('metas')
        .insert([{
          user_id: user.id,
          titulo: meta.titulo,
          descricao: meta.descricao || null,
          valor_total: meta.valor_total,
          valor_por_periodo: meta.valor_por_periodo,
          total_periodos: meta.total_periodos
        }])
        .select()
        .single();

    if (error) {
      console.error('Erro ao criar meta:', error);
      throw error;
    }

    return {
      ...data,
      valor_total: Number(data.valor_total),
      valor_por_periodo: Number(data.valor_por_periodo),
      total_periodos: Number(data.total_periodos)
    } as Meta;

  }


  // =====================================================
  // EXCLUIR META
  // =====================================================

  async excluirMeta(id: string): Promise<void> {

    const { error } =
      await this.supabaseService.supabase
        .from('metas')
        .delete()
        .eq('id', id);

    if (error) {
      console.error('Erro ao excluir meta:', error);
      throw error;
    }

  }


  // =====================================================
  // LISTAR PAGAMENTOS DE UMA META
  // =====================================================

  async listarPagamentos(metaId: string): Promise<MetaPagamento[]> {

    const { data, error } =
      await this.supabaseService.supabase
        .from('metas_pagamentos')
        .select('*')
        .eq('meta_id', metaId)
        .order('periodo', { ascending: true });

    if (error) {
      console.error('Erro ao listar pagamentos:', error);
      throw error;
    }

    return (data || []) as MetaPagamento[];

  }


  // =====================================================
  // TOGGLE PAGAMENTO (MARCAR / DESMARCAR BLOCO)
  // =====================================================

  async togglePagamento(
    metaId: string,
    periodo: number,
    pagoAtual: boolean
  ): Promise<MetaPagamento> {

    const user = await this.obterUsuario();

    const novoPago = !pagoAtual;

    const { data, error } =
      await this.supabaseService.supabase
        .from('metas_pagamentos')
        .upsert(
          {
            meta_id: metaId,
            user_id: user.id,
            periodo: periodo,
            pago: novoPago
          },
          { onConflict: 'meta_id,periodo' }
        )
        .select()
        .single();

    if (error) {
      console.error('Erro ao atualizar pagamento:', error);
      throw error;
    }

    return data as MetaPagamento;

  }

}
