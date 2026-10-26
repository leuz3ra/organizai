import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  eyeOutline,
  eyeOffOutline,
  lockClosedOutline,
  arrowForwardOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  sparklesOutline
} from 'ionicons/icons';

import { SupabaseService } from '../../services/supabase.service';
import { traduzirErro } from '../../utils/error-messages';

export interface CriterioSenha {
  id: string;
  label: string;
  valido: boolean;
}

@Component({
  selector: 'app-redefinir-senha',
  templateUrl: './redefinir-senha.page.html',
  styleUrls: ['./redefinir-senha.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon
  ]
})
export class RedefinirSenhaPage implements OnInit {

  senha = '';
  confirmarSenha = '';

  mostrarSenha = false;
  mostrarConfirmarSenha = false;

  carregando = false;
  verificandoSessao = true;
  sessaoValida = true;

  erro = '';
  sucesso = '';

  criteriosSenha: CriterioSenha[] = [
    { id: 'min8', label: 'Mínimo de 8 caracteres', valido: false },
    { id: 'maiuscula', label: 'Uma letra maiúscula (A-Z)', valido: false },
    { id: 'minuscula', label: 'Uma letra minúscula (a-z)', valido: false },
    { id: 'numero', label: 'Pelo menos um número (0-9)', valido: false },
    { id: 'especial', label: 'Um caractere especial (!@#$...)', valido: false }
  ];

  pontuacaoSenha = 0;
  nivelForca: { label: string; classe: string } = { label: 'Muito fraca', classe: 'muito-fraca' };
  senhaValida = false;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    addIcons({
      eyeOutline,
      eyeOffOutline,
      lockClosedOutline,
      arrowForwardOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      sparklesOutline
    });
  }

  async ngOnInit() {
    this.onSenhaInput();
    await this.verificarSessao();
  }

  async verificarSessao() {
    this.verificandoSessao = true;
    try {
      // 1. Processa quaisquer tokens de recuperação na URL (hash fragment ou query params)
      await this.supabaseService.processarTokensUrl();

      // 2. Verifica se a sessão está estabelecida
      let sessao = await this.supabaseService.obterSessao();
      if (!sessao) {
        // Aguarda breve intervalo para o Supabase resolver callbacks assíncronos de URL
        await new Promise(resolve => setTimeout(resolve, 800));
        sessao = await this.supabaseService.obterSessao();
      }

      if (!sessao) {
        this.sessaoValida = false;
        this.erro = 'Sua sessão de recuperação é inválida ou expirou. Por favor, solicite um novo link.';
      } else {
        this.sessaoValida = true;
        this.erro = '';
      }
    } catch (e) {
      console.warn('Erro ao checar sessão de recuperação:', e);
      this.sessaoValida = false;
      this.erro = 'Não foi possível validar o link de recuperação. Por favor, solicite um novo link.';
    } finally {
      this.verificandoSessao = false;
    }
  }

  trackByCriterio(index: number, c: CriterioSenha): string {
    return c.id;
  }

  onSenhaInput() {
    const s = this.senha || '';
    this.criteriosSenha[0].valido = s.length >= 8;
    this.criteriosSenha[1].valido = /[A-Z]/.test(s);
    this.criteriosSenha[2].valido = /[a-z]/.test(s);
    this.criteriosSenha[3].valido = /[0-9]/.test(s);
    this.criteriosSenha[4].valido = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s);

    const aprovados = this.criteriosSenha.filter(c => c.valido).length;
    this.pontuacaoSenha = Math.round((aprovados / 5) * 100);
    this.senhaValida = aprovados === 5;

    if (this.pontuacaoSenha <= 20) {
      this.nivelForca = { label: 'Muito fraca', classe: 'muito-fraca' };
    } else if (this.pontuacaoSenha <= 40) {
      this.nivelForca = { label: 'Fraca', classe: 'fraca' };
    } else if (this.pontuacaoSenha <= 60) {
      this.nivelForca = { label: 'Média', classe: 'media' };
    } else if (this.pontuacaoSenha <= 80) {
      this.nivelForca = { label: 'Forte', classe: 'forte' };
    } else {
      this.nivelForca = { label: 'Excelente', classe: 'excelente' };
    }
  }

  toggleMostrarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  toggleMostrarConfirmarSenha() {
    this.mostrarConfirmarSenha = !this.mostrarConfirmarSenha;
  }

  async salvarNovaSenha() {
    this.erro = '';
    this.sucesso = '';

    if (!this.senha) {
      this.erro = 'Por favor, digite sua nova senha.';
      return;
    }

    if (!this.senhaValida) {
      this.erro = 'Sua nova senha precisa atender a todos os requisitos de segurança abaixo.';
      return;
    }

    if (this.senha !== this.confirmarSenha) {
      this.erro = 'As senhas digitadas não coincidem.';
      return;
    }

    this.carregando = true;

    try {
      await this.supabaseService.atualizarSenha(this.senha);
      this.sucesso = 'Senha atualizada com sucesso! Redirecionando para o login...';

      // 1. Limpa imediatamente o hash da URL do navegador para evitar loop de recuperação
      if (typeof window !== 'undefined') {
        try {
          window.history.replaceState(null, '', '/login');
        } catch (e) {
          console.warn('Erro ao limpar history state:', e);
        }
      }

      // 2. Encerra a sessão temporária de recuperação para que o usuário realize o login normal
      try {
        await this.supabaseService.logout();
      } catch (e) {
        console.warn('Logout pós-redefinição:', e);
      }

      this.senha = '';
      this.confirmarSenha = '';
      this.onSenhaInput();

      setTimeout(() => {
        this.router.navigate(['/login'], {
          replaceUrl: true,
          queryParams: { redefinida: 'true' }
        });
      }, 1000);

    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      this.erro = traduzirErro(error, 'Não foi possível atualizar sua senha no momento. Tente novamente mais tarde.');
    } finally {
      this.carregando = false;
    }
  }


  solicitarNovoLink() {
    this.router.navigate(['/login'], { queryParams: { modo: 'esqueci' } });
  }

  voltarParaLogin() {
    this.router.navigate(['/login']);
  }

}

