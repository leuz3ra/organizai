import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  try {
    const user = await supabaseService.usuarioAtual();
    if (user) {
      return true;
    }
  } catch (error) {
    console.warn('Erro ao verificar autenticação na rota:', error);
  }

  // Redireciona para o login se não autenticado
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
