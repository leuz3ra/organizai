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
      // Fallback para usuário atual do Supabase no localStorage se disponível
      try {
        const authData = localStorage.getItem('sb-dkftcjsofgpllrmswpmw-auth-token');
        if (authData) {
          const parsed = JSON.parse(authData);
          if (parsed?.user?.id) {
            this.currentUserId = parsed.user.id;
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
