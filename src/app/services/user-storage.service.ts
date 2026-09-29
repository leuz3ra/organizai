import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class UserStorageService {
  private currentUserId: string | null = null;

  constructor(private supabaseService: SupabaseService) {
    this.carregarUsuarioAtual();
  }

  async carregarUsuarioAtual(): Promise<string | null> {
    try {
      const user = await this.supabaseService.usuarioAtual();
      this.currentUserId = user?.id || null;
      return this.currentUserId;
    } catch {
      this.currentUserId = null;
      return null;
    }
  }

  setUserId(id: string | null) {
    this.currentUserId = id;
  }

  private resolveKey(key: string): string {
    if (!this.currentUserId) {
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
