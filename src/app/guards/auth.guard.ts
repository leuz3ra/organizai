import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

function isRecoveryFlow(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  return (
    (hash.includes('type=recovery') && hash.includes('access_token')) ||
    (search.includes('type=recovery') && search.includes('code'))
  );
}


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

  if (isRecoveryFlow()) {
    await supabaseService.processarTokensUrl();
    const fragment = typeof window !== 'undefined' && window.location.hash ? window.location.hash.substring(1) : undefined;
    router.navigate(['/redefinir-senha'], {
      replaceUrl: true,
      fragment,
      queryParamsHandling: 'preserve'
    });
    return false;
  }

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

  if (isRecoveryFlow()) {
    await supabaseService.processarTokensUrl();
    const fragment = typeof window !== 'undefined' && window.location.hash ? window.location.hash.substring(1) : undefined;
    router.navigate(['/redefinir-senha'], {
      replaceUrl: true,
      fragment,
      queryParamsHandling: 'preserve'
    });
    return false;
  }

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



