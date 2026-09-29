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

  router.navigate(['/login'], { queryParams: { returnUrl: state.url }, replaceUrl: true });
  return false;
};

export const noAuthGuard: CanActivateFn = async () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  try {
    const user = await supabaseService.usuarioAtual();
    if (user) {
      router.navigate(['/dashboard'], { replaceUrl: true });
      return false;
    }
  } catch (error) {
    console.warn('Erro ao verificar sessão do usuário:', error);
  }

  return true;
};

export const initialGuard: CanActivateFn = async () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  try {
    const user = await supabaseService.usuarioAtual();
    if (user) {
      router.navigate(['/dashboard'], { replaceUrl: true });
      return false;
    }
  } catch (error) {
    console.warn('Erro ao verificar rota inicial:', error);
  }

  router.navigate(['/login'], { replaceUrl: true });
  return false;
};

