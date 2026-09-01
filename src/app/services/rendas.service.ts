import { Injectable } from '@angular/core';

import { SupabaseService } from './supabase.service';
import { Renda } from '../models/renda.model';

export function parseNum(val: any): number {
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
    } = await this.supabaseService.supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Usuário não está autenticado no Supabase.');
    }

    const { data, error } =
      await this.supabaseService.supabase
        .from('rendas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar investimentos:', error);
      throw error;
    }

    return (data || []).map((item: any) => {
      const valor = parseNum(item.valor_investido);
      const taxa = parseNum(item.percentual_rendimento);
      const rendimento = parseNum(item.rendimento);
      const saldo = parseNum(item.saldo_atual) || valor;

      return {
        id: item.id,
        titulo: item.titulo,
        categoria: item.categoria || 'Investimento',
        tipo_investimento: item.tipo_investimento,
        valor_investido: valor,
        percentual_rendimento: taxa,
        rendimento: rendimento,
        saldo_atual: saldo,
        data_recebimento: item.data_recebimento,
        descricao: item.descricao || null,
        user_id: item.user_id,
        created_at: item.created_at
      } as Renda;
    });
  }


  // =====================================================
  // SALVAR NOVO INVESTIMENTO
  // =====================================================

  async salvarRenda(renda: Renda): Promise<Renda> {
    const {
      data: { user },
      error: userError
    } = await this.supabaseService.supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Usuário não está autenticado no Supabase.');
    }

    const valorInvestido = parseNum(renda.valor_investido);
    const percentual = parseNum(renda.percentual_rendimento);

    const investimento = {
      titulo: renda.titulo.trim(),
      categoria: renda.categoria || 'Investimento',
      tipo_investimento: renda.tipo_investimento.trim(),
      valor_investido: valorInvestido,
      percentual_rendimento: percentual,
      rendimento: 0,
      saldo_atual: valorInvestido,
      data_recebimento: renda.data_recebimento,
      descricao: renda.descricao?.trim() || null,
      user_id: user.id
    };

    const { data, error } =
      await this.supabaseService.supabase
        .from('rendas')
        .insert([investimento])
        .select()
        .single();

    if (error) {
      console.error('Erro ao salvar investimento:', error);
      throw error;
    }

    return {
      id: data.id,
      titulo: data.titulo,
      categoria: data.categoria,
      tipo_investimento: data.tipo_investimento,
      valor_investido: parseNum(data.valor_investido),
      percentual_rendimento: parseNum(data.percentual_rendimento),
      rendimento: parseNum(data.rendimento),
      saldo_atual: parseNum(data.saldo_atual),
      data_recebimento: data.data_recebimento,
      descricao: data.descricao,
      user_id: data.user_id,
      created_at: data.created_at
    } as Renda;
  }


  // =====================================================
  // EDITAR INVESTIMENTO
  // =====================================================

  async editarRenda(id: string, renda: Partial<Renda>): Promise<Renda> {
    const { data, error } =
      await this.supabaseService.supabase
        .from('rendas')
        .update(renda)
        .eq('id', id)
        .select()
        .single();

    if (error) {
      console.error('Erro ao editar investimento:', error);
      throw error;
    }

    return {
      ...data,
      valor_investido: parseNum(data.valor_investido),
      percentual_rendimento: parseNum(data.percentual_rendimento),
      rendimento: parseNum(data.rendimento),
      saldo_atual: parseNum(data.saldo_atual)
    } as Renda;
  }


  // =====================================================
  // EXCLUIR INVESTIMENTO
  // =====================================================

  async excluirRenda(id: string): Promise<void> {
    const { error } =
      await this.supabaseService.supabase
        .from('rendas')
        .delete()
        .eq('id', id);

    if (error) {
      console.error('Erro ao excluir investimento:', error);
      throw error;
    }
  }

}