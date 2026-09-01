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
      environment.supabaseKey
    );
  }

  // ==============================
  // AUTENTICAÇÃO & PERFIL
  // ==============================

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
    const { data, error } =
      await this.supabase.auth.getUser();

    if (error) {
      return null;
    }

    return data.user;
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