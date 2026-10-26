import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  IonContent,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  eyeOutline,
  eyeOffOutline,
  lockClosedOutline,
  mailOutline,
  personOutline,
  shieldCheckmarkOutline,
  arrowForwardOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  sparklesOutline
} from 'ionicons/icons';

import { SupabaseService } from '../../services/supabase.service';
import { traduzirErro } from '../../utils/error-messages';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon
  ]
})
export class LoginPage implements OnInit, OnDestroy {

  modoTela: 'login' | 'esqueci-senha' = 'login';

  email = '';
  senha = '';
  emailEsqueci = '';
  mostrarSenha = false;

  carregando = false;
  erro = '';
  sucesso = '';

  private querySub?: Subscription;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({
      eyeOutline,
      eyeOffOutline,
      lockClosedOutline,
      mailOutline,
      personOutline,
      shieldCheckmarkOutline,
      arrowForwardOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      sparklesOutline
    });
  }

  async ngOnInit() {
    this.querySub = this.route.queryParams.subscribe(params => {
      if (params && params['modo'] === 'esqueci') {
        this.modoTela = 'esqueci-senha';
      }
      if (params && params['redefinida'] === 'true') {
        this.sucesso = 'Sua nova senha foi cadastrada com sucesso! Faça login para continuar.';
        this.modoTela = 'login';
      }
    });

    await this.verificarSessao();
  }

  ngOnDestroy() {
    this.querySub?.unsubscribe();
  }

  async ionViewWillEnter() {
    await this.verificarSessao();
  }

  private async verificarSessao() {
    const hash = typeof window !== 'undefined' ? window.location.hash || '' : '';
    const search = typeof window !== 'undefined' ? window.location.search || '' : '';

    if (
      (hash.includes('type=recovery') && hash.includes('access_token')) ||
      (search.includes('type=recovery') && search.includes('code'))
    ) {
      await this.supabaseService.processarTokensUrl();
      const fragment = hash ? hash.substring(1) : undefined;
      this.router.navigate(['/redefinir-senha'], {
        replaceUrl: true,
        fragment,
        queryParamsHandling: 'preserve'
      });
      return;
    }

    try {
      const user = await this.supabaseService.usuarioAtual();
      if (user) {
        this.router.navigate(['/dashboard'], { replaceUrl: true });
      }
    } catch (e) {
      console.warn('Erro ao verificar sessão ativa:', e);
    }
  }



  toggleMostrarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  abrirEsqueciSenha() {
    this.modoTela = 'esqueci-senha';
    this.emailEsqueci = this.email.trim();
    this.erro = '';
    this.sucesso = '';
  }

  voltarAoLogin() {
    this.modoTela = 'login';
    this.erro = '';
    this.sucesso = '';
  }

  async entrar() {
    this.erro = '';
    this.sucesso = '';

    const emailFormatado = this.email.trim().toLowerCase();

    if (!emailFormatado || !this.senha) {
      this.erro = 'Por favor, preencha seu e-mail e sua senha.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailFormatado)) {
      this.erro = 'Informe um endereço de e-mail válido.';
      return;
    }

    this.carregando = true;

    try {
      await this.supabaseService.login(
        emailFormatado,
        this.senha
      );

      await this.router.navigate(['/dashboard']);

    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      this.erro = traduzirErro(error, 'Não foi possível fazer login. Verifique suas credenciais e tente novamente.');
    } finally {
      this.carregando = false;
    }
  }

  async enviarLinkRecuperacao() {
    this.erro = '';
    this.sucesso = '';

    const emailFormatado = this.emailEsqueci.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailFormatado || !emailRegex.test(emailFormatado)) {
      this.erro = 'Informe um endereço de e-mail válido para a recuperação.';
      return;
    }

    this.carregando = true;

    try {
      await this.supabaseService.redefinirSenha(emailFormatado);
      this.sucesso = `Um link seguro para redefinição foi enviado para ${emailFormatado}. Verifique sua caixa de entrada e pasta de spam.`;
    } catch (error: any) {
      console.error('Erro ao enviar link de recuperação:', error);
      this.erro = traduzirErro(error, 'Não foi possível enviar o link de recuperação. Tente novamente mais tarde.');
    } finally {
      this.carregando = false;
    }
  }


  irParaCadastro() {
    this.router.navigate(['/cadastro']);
  }

}