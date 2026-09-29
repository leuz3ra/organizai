import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storage: localStorage
        }
      }
    );
  }

  // ==============================
  // SESSÃO & PERSISTÊNCIA
  // ==============================

  async obterSessao() {
    try {
      const { data, error } = await this.supabase.auth.getSession();
      if (error || !data?.session) {
        return null;
      }
      return data.session;
    } catch {
      return null;
    }
  }

  async cadastrar(
    email: string,
    senha: string,
    nome: string
  ) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome: nome
        }
      }
    });

    if (error) {
      throw error;
    }

    // Se o usuário foi criado, também registra na tabela profiles caso exista
    if (data?.user) {
      try {
        await this.supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            nome: nome,
            email: email
          });
      } catch (profileError) {
        console.warn('Nota: Inserção em profiles ignorada:', profileError);
      }
    }

    return data;
  }

  async login(
    email: string,
    senha: string
  ) {
    const { data, error } =
      await this.supabase.auth.signInWithPassword({
        email,
        password: senha
      });

    if (error) {
      throw error;
    }

    return data;
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  async usuarioAtual() {
    try {
      const sessao = await this.obterSessao();
      if (sessao?.user) {
        return sessao.user;
      }
      const { data, error } = await this.supabase.auth.getUser();
      if (error || !data?.user) {
        return null;
      }
      return data.user;
    } catch {
      return null;
    }
  }

  async obterNomePerfil(userId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('nome')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data && data.nome) {
        return data.nome;
      }
    } catch (e) {
      console.warn('Erro ao consultar tabela profiles:', e);
    }
    return null;
  }

}