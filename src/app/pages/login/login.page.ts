import { Component } from '@angular/core';
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
  mailOutline,
  personOutline,
  shieldCheckmarkOutline,
  arrowForwardOutline,
  alertCircleOutline,
  sparklesOutline
} from 'ionicons/icons';

import { SupabaseService } from '../../services/supabase.service';

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
export class LoginPage {

  email = '';
  senha = '';
  mostrarSenha = false;

  carregando = false;
  erro = '';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
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
      sparklesOutline
    });
  }

  toggleMostrarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  async entrar() {
    this.erro = '';

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

      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
        this.erro = 'E-mail ou senha incorretos. Verifique suas credenciais.';
      } else if (msg.includes('email not confirmed')) {
        this.erro = 'Por favor, confirme seu e-mail para acessar a conta.';
      } else {
        this.erro = error?.message || 'Não foi possível fazer login. Tente novamente.';
      }

    } finally {
      this.carregando = false;
    }
  }

  irParaCadastro() {
    this.router.navigate(['/cadastro']);
  }

}