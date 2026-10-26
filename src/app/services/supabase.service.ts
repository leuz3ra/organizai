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
          detectSessionInUrl: true,
          storage: localStorage
        }
      }
    );

    // Processa tokens de autenticação caso a página tenha sido aberta via link de e-mail
    this.processarTokensUrl().catch(err => {
      console.warn('Processamento inicial de tokens:', err);
    });

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

  async redefinirSenha(email: string) {
    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/redefinir-senha`
      : 'http://localhost:8100/redefinir-senha';

    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Processa tokens presentes na URL (hash fragment ou query params)
   * e estabelece a sessão de autenticação.
   */
  async processarTokensUrl(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      const hash = window.location.hash || '';
      const search = window.location.search || '';

      // 1. Fragmento hash com access_token e refresh_token (padrão em links de recuperação)
      if (hash.includes('access_token=') && hash.includes('refresh_token=')) {
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data, error } = await this.supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (!error && data?.session) {
            this._cachedUser = data.session.user;
            this._cacheTs = Date.now();
            return true;
          }
        }
      }

      // 2. Query param com código PKCE (?code=...)
      if (search.includes('code=')) {
        const searchParams = new URLSearchParams(search);
        const code = searchParams.get('code');
        if (code) {
          const { data, error } = await this.supabase.auth.exchangeCodeForSession(code);
          if (!error && data?.session) {
            this._cachedUser = data.session.user;
            this._cacheTs = Date.now();
            return true;
          }
        }
      }

      // 3. Query param com token_hash (?token_hash=...&type=recovery)
      if (search.includes('token_hash=')) {
        const searchParams = new URLSearchParams(search);
        const tokenHash = searchParams.get('token_hash');
        const type = (searchParams.get('type') || 'recovery') as any;
        if (tokenHash) {
          const { data, error } = await this.supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type
          });
          if (!error && data?.session) {
            this._cachedUser = data.session.user;
            this._cacheTs = Date.now();
            return true;
          }
        }
      }

      // 4. Verifica se já existe sessão ativa
      const { data: sessionData } = await this.supabase.auth.getSession();
      if (sessionData?.session?.user) {
        this._cachedUser = sessionData.session.user;
        this._cacheTs = Date.now();
        return true;
      }

      return false;
    } catch (err) {
      console.warn('Erro ao processar tokens da URL:', err);
      return false;
    }
  }

  async atualizarSenha(novaSenha: string) {
    // Garante que tentamos processar quaisquer tokens de URL primeiro
    await this.processarTokensUrl();

    // Verifica sessão ativa
    const sessao = await this.obterSessao();
    if (!sessao) {
      throw new Error('AUTH_SESSION_MISSING');
    }

    const { data, error } = await this.supabase.auth.updateUser({
      password: novaSenha
    });
    if (error) {
      throw error;
    }
    return data;
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