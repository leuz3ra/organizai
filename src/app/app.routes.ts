import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
  path: 'login',
  loadComponent: () =>
    import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
    path: 'visao-geral',
    loadComponent: () => import('./pages/visao-geral/visao-geral.page').then(m => m.VisaoGeralPage)
  },
  {
    path: 'novo-investimento',
    loadComponent: () => import('./pages/novo-investimento/novo-investimento.page').then( m => m.NovoInvestimentoPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./pages/cadastro/cadastro.page').then( m => m.CadastroPage)
  },
  {
    path: 'metas',
    loadComponent: () => import('./pages/metas/metas.page').then( m => m.MetasPage)
  },
  {
    path: 'pagamentos',
    loadComponent: () => import('./pages/pagamentos/pagamentos.page').then( m => m.PagamentosPage)
  },
  {
    path: 'dicas',
    loadComponent: () => import('./pages/dicas/dicas.page').then( m => m.DicasPage)
  },
  {
    path: 'assinaturas',
    loadComponent: () => import('./pages/assinaturas/assinaturas.page').then( m => m.AssinaturasPage)
  },
  {
    path: 'boletos',
    loadComponent: () => import('./pages/boletos/boletos.page').then( m => m.BoletosPage)
  },
  {
    path: 'contas-fixas',
    loadComponent: () => import('./pages/contas-fixas/contas-fixas.page').then( m => m.ContasFixasPage)
  },
];
