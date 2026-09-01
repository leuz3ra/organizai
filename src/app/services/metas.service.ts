import { Injectable } from '@angular/core';

import { SupabaseService } from './supabase.service';
import { Meta, MetaPagamento } from '../models/meta.model';

function parseNum(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let s = String(val).replace(/\s/g, '').replace(/R\$/gi, '').trim();
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

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

    return (data || []).map((item: any) => {
      const total = parseNum(item.valor_total);
      const periodos = Math.max(1, Math.round(parseNum(item.total_periodos)));
      const porPeriodo = item.valor_por_periodo ? parseNum(item.valor_por_periodo) : (total / periodos);

      return {
        id: item.id,
        titulo: item.titulo,
        descricao: item.descricao,
        valor_total: total,
        total_periodos: periodos,
        valor_por_periodo: Number(porPeriodo.toFixed(2)),
        user_id: item.user_id,
        created_at: item.created_at
      } as Meta;
    });
  }


  // =====================================================
  // CRIAR META
  // =====================================================

  async criarMeta(meta: Omit<Meta, 'id' | 'user_id' | 'created_at'>): Promise<Meta> {
    const user = await this.obterUsuario();

    const valorTotal = parseNum(meta.valor_total);
    const totalPeriodos = Math.max(1, Math.round(parseNum(meta.total_periodos)));
    const valorPorPeriodo = Number((valorTotal / totalPeriodos).toFixed(2));

    const { data, error } =
      await this.supabaseService.supabase
        .from('metas')
        .insert([{
          user_id: user.id,
          titulo: meta.titulo,
          descricao: meta.descricao || null,
          valor_total: valorTotal,
          valor_por_periodo: valorPorPeriodo,
          total_periodos: totalPeriodos
        }])
        .select()
        .single();

    if (error) {
      console.error('Erro ao criar meta:', error);
      throw error;
    }

    return {
      id: data.id,
      titulo: data.titulo,
      descricao: data.descricao,
      valor_total: parseNum(data.valor_total),
      valor_por_periodo: parseNum(data.valor_por_periodo),
      total_periodos: parseNum(data.total_periodos),
      user_id: data.user_id,
      created_at: data.created_at
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

    return (data || []).map((p: any) => ({
      id: p.id,
      meta_id: p.meta_id,
      user_id: p.user_id,
      periodo: Number(p.periodo),
      pago: Boolean(p.pago),
      data_pagamento: p.data_pagamento
    })) as MetaPagamento[];
  }

  // =====================================================
  // LISTAR TODOS OS PAGAMENTOS DO USUÁRIO
  // =====================================================

  async listarTodosPagamentosUsuario(): Promise<MetaPagamento[]> {
    try {
      const user = await this.obterUsuario();
      const { data, error } = await this.supabaseService.supabase
        .from('metas_pagamentos')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) {
        return data.map((p: any) => ({
          id: p.id,
          meta_id: p.meta_id,
          user_id: p.user_id,
          periodo: Number(p.periodo),
          pago: Boolean(p.pago),
          data_pagamento: p.data_pagamento
        }));
      }
    } catch (e) {
      console.warn('Erro ao carregar pagamentos globais:', e);
    }
    return [];
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
            periodo: Number(periodo),
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

    return {
      id: data.id,
      meta_id: data.meta_id,
      user_id: data.user_id,
      periodo: Number(data.periodo),
      pago: Boolean(data.pago),
      data_pagamento: data.data_pagamento
    } as MetaPagamento;
  }

}
