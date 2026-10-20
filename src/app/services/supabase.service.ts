import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  supabase: SupabaseClient;

  // Cache de sessão em memória — evita chamadas de rede redundantes a cada troca de tela
  private _cachedUser: any = null;
  private _cacheTs: number = 0;
  private readonly CACHE_TTL_MS = 30_000; // 30 segundos

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

    // Invalida/atualiza cache quando a sessão mudar (login/logout automático)
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        this._cachedUser = null;
        this._cacheTs = 0;
      } else if (session?.user) {
        this._cachedUser = session.user;
        this._cacheTs = Date.now();
      }
    });
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

    // Popula cache imediatamente após login bem-sucedido
    if (data?.user) {
      this._cachedUser = data.user;
      this._cacheTs = Date.now();
    }

    return data;
  }

  async logout() {
    // Invalida cache antes mesmo de chamar a API
    this._cachedUser = null;
    this._cacheTs = 0;
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }

  /**
   * Retorna o usuário autenticado.
   * Cache em memória (30s) evita chamadas de rede repetidas a cada troca de tela.
   * getSession() lê do localStorage sem fazer request HTTP.
   */
  async usuarioAtual() {
    // Retorna do cache se ainda válido
    if (this._cachedUser && (Date.now() - this._cacheTs) < this.CACHE_TTL_MS) {
      return this._cachedUser;
    }

    try {
      // getSession() lê do localStorage — sem chamada de rede
      const { data: sessionData } = await this.supabase.auth.getSession();
      if (sessionData?.session?.user) {
        this._cachedUser = sessionData.session.user;
        this._cacheTs = Date.now();
        return this._cachedUser;
      }
      this._cachedUser = null;
      return null;
    } catch {
      this._cachedUser = null;
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