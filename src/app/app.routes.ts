import { Routes } from '@angular/router';
import { authGuard, noAuthGuard, initialGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [initialGuard],
    children: []
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
    canActivate: [noAuthGuard],
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./pages/cadastro/cadastro.page').then(m => m.CadastroPage),
    canActivate: [noAuthGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [authGuard],
  },
  {
    path: 'visao-geral',
    loadComponent: () => import('./pages/visao-geral/visao-geral.page').then(m => m.VisaoGeralPage),
    canActivate: [authGuard],
  },
  {
    path: 'metas',
    loadComponent: () => import('./pages/metas/metas.page').then(m => m.MetasPage),
    canActivate: [authGuard],
  },
  {
    path: 'pagamentos',
    loadComponent: () => import('./pages/pagamentos/pagamentos.page').then(m => m.PagamentosPage),
    canActivate: [authGuard],
  },
  {
    path: 'assinaturas',
    loadComponent: () => import('./pages/assinaturas/assinaturas.page').then(m => m.AssinaturasPage),
    canActivate: [authGuard],
  },
  {
    path: 'boletos',
    loadComponent: () => import('./pages/boletos/boletos.page').then(m => m.BoletosPage),
    canActivate: [authGuard],
  },
  {
    path: 'contas-fixas',
    loadComponent: () => import('./pages/contas-fixas/contas-fixas.page').then(m => m.ContasFixasPage),
    canActivate: [authGuard],
  },
  {
    path: 'dicas',
    loadComponent: () => import('./pages/dicas/dicas.page').then(m => m.DicasPage),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'login',
  }
];
