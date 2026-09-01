export interface Meta {
  id?: string;
  user_id?: string;
  titulo: string;
  descricao?: string | null;
  valor_total: number;
  valor_por_periodo: number;
  total_periodos: number;
  created_at?: string;
}

export interface MetaPagamento {
  id?: string;
  meta_id: string;
  user_id?: string;
  periodo: number;
  pago: boolean;
  created_at?: string;
}
