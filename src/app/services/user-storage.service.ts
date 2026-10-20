import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class UserStorageService {
  private currentUserId: string | null = null;
  private _loadPromise: Promise<string | null> | null = null;

  constructor(private supabaseService: SupabaseService) {
    // Carrega o usuário ao inicializar o serviço (uma única vez)
    this.carregarUsuarioAtual();
  }

  /**
   * Carrega e cacheia o userId. Se já houver uma carga em andamento,
   * devolve a mesma Promise sem fazer nova chamada (deduplicação).
   * Isso resolve o problema de múltiplas telas chamando carregarUsuarioAtual()
   * em ngOnInit + ionViewWillEnter simultaneamente.
   */
  async carregarUsuarioAtual(): Promise<string | null> {
    // Se já tem o userId, retorna imediatamente sem chamada de rede
    if (this.currentUserId) {
      return this.currentUserId;
    }

    // Deduplica chamadas simultâneas (ngOnInit + ionViewWillEnter)
    if (this._loadPromise) {
      return this._loadPromise;
    }

    this._loadPromise = this.supabaseService.usuarioAtual()
      .then(user => {
        this.currentUserId = user?.id || null;
        this._loadPromise = null;
        return this.currentUserId;
      })
      .catch(() => {
        this.currentUserId = null;
        this._loadPromise = null;
        return null;
      });

    return this._loadPromise;
  }

  setUserId(id: string | null) {
    this.currentUserId = id;
  }

  /**
   * Limpa o userId cacheado (usar no logout)
   */
  clearUserId() {
    this.currentUserId = null;
    this._loadPromise = null;
  }

  private resolveKey(key: string): string {
    if (!this.currentUserId) {
      // Tenta recuperar do localStorage de forma síncrona como fallback
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed?.user?.id) {
                this.currentUserId = parsed.user.id;
                break;
              }
            }
          }
        }
      } catch {}
    }

    if (this.currentUserId) {
      return `organizai_${this.currentUserId}_${key}`;
    }
    return `organizai_${key}`;
  }

  getItem(key: string): string | null {
    const userKey = this.resolveKey(key);
    const valor = localStorage.getItem(userKey);

    // Se não encontrou na chave do usuário, tenta a chave legada e migra automaticamente
    if (valor === null && this.currentUserId) {
      const legacyKey = `organizai_${key}`;
      const legacyValor = localStorage.getItem(legacyKey);
      if (legacyValor !== null) {
        localStorage.setItem(userKey, legacyValor);
        return legacyValor;
      }
    }

    return valor;
  }

  setItem(key: string, value: string): void {
    const userKey = this.resolveKey(key);
    localStorage.setItem(userKey, value);
  }

  removeItem(key: string): void {
    const userKey = this.resolveKey(key);
    localStorage.removeItem(userKey);
    // Também limpa chave legada se existir
    localStorage.removeItem(`organizai_${key}`);
  }
}
