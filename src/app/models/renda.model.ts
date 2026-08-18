export interface Renda {

  id?: string;

  titulo: string;

  categoria: string;

  tipo_investimento: string;

  valor_investido: number;

  percentual_rendimento: number;

  rendimento: number;

  saldo_atual: number;

  data_recebimento: string;

  descricao?: string | null;

  user_id?: string;

  created_at?: string;

}