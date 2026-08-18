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
  // AUTENTICAÇÃO
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

}