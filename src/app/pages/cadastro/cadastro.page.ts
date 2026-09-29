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
  mailOutline,
  personOutline,
  shieldCheckmarkOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  arrowForwardOutline,
  sparklesOutline,
  alertCircleOutline
} from 'ionicons/icons';

import { SupabaseService } from '../../services/supabase.service';

export interface CriterioSenha {
  id: string;
  label: string;
  valido: boolean;
}

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon
  ]
})
export class CadastroPage implements OnInit {

  nome = '';
  email = '';
  senha = '';
  confirmarSenha = '';

  mostrarSenha = false;
  mostrarConfirmarSenha = false;

  carregando = false;
  erro = '';
  sucesso = '';

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
      checkmarkCircleOutline,
      closeCircleOutline,
      arrowForwardOutline,
      sparklesOutline,
      alertCircleOutline
    });
  }

  async ngOnInit() {
    await this.verificarSessao();
  }

  async ionViewWillEnter() {
    await this.verificarSessao();
  }

  private async verificarSessao() {
    try {
      const user = await this.supabaseService.usuarioAtual();
      if (user) {
        this.router.navigate(['/dashboard'], { replaceUrl: true });
      }
    } catch {}
  }

  // =====================================================
  // CRITÉRIOS E FORÇA DA SENHA
  // =====================================================

  get criteriosSenha(): CriterioSenha[] {
    const s = this.senha || '';
    return [
      { id: 'min8', label: 'Mínimo de 8 caracteres', valido: s.length >= 8 },
      { id: 'maiuscula', label: 'Uma letra maiúscula (A-Z)', valido: /[A-Z]/.test(s) },
      { id: 'minuscula', label: 'Uma letra minúscula (a-z)', valido: /[a-z]/.test(s) },
      { id: 'numero', label: 'Pelo menos um número (0-9)', valido: /[0-9]/.test(s) },
      { id: 'especial', label: 'Um caractere especial (!@#$...)', valido: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s) }
    ];
  }

  get pontuacaoSenha(): number {
    const aprovados = this.criteriosSenha.filter(c => c.valido).length;
    return Math.round((aprovados / 5) * 100);
  }

  get nivelForca(): { label: string; classe: string } {
    const p = this.pontuacaoSenha;
    if (p <= 20) return { label: 'Muito fraca', classe: 'muito-fraca' };
    if (p <= 40) return { label: 'Fraca', classe: 'fraca' };
    if (p <= 60) return { label: 'Média', classe: 'media' };
    if (p <= 80) return { label: 'Forte', classe: 'forte' };
    return { label: 'Excelente', classe: 'excelente' };
  }

  get senhaValida(): boolean {
    return this.criteriosSenha.every(c => c.valido);
  }

  toggleMostrarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  toggleMostrarConfirmarSenha() {
    this.mostrarConfirmarSenha = !this.mostrarConfirmarSenha;
  }

  // =====================================================
  // CADASTRO COM VALIDAÇÃO ROBUSTA
  // =====================================================

  async cadastrar() {
    this.erro = '';
    this.sucesso = '';

    const nomeFormatado = this.nome.trim();
    const emailFormatado = this.email.trim().toLowerCase();

    // 1. Campos obrigatórios
    if (!nomeFormatado) {
      this.erro = 'Por favor, informe seu nome completo.';
      return;
    }

    if (!emailFormatado) {
      this.erro = 'Por favor, informe seu endereço de e-mail.';
      return;
    }

    // 2. Validação de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailFormatado)) {
      this.erro = 'Informe um e-mail válido (ex: seu.nome@email.com).';
      return;
    }

    // 3. Validação de força de senha
    if (!this.senha) {
      this.erro = 'Informe uma senha segura.';
      return;
    }

    if (!this.senhaValida) {
      this.erro = 'Sua senha precisa atender a todos os requisitos de segurança abaixo.';
      return;
    }

    // 4. Confirmação de senha
    if (this.senha !== this.confirmarSenha) {
      this.erro = 'As senhas digitadas não coincidem.';
      return;
    }

    this.carregando = true;

    try {
      // 5. Verificação prévia de e-mail duplicado na tabela profiles (se acessível)
      try {
        const { data: usuarioExistente } = await this.supabaseService.supabase
          .from('profiles')
          .select('id')
          .eq('email', emailFormatado)
          .maybeSingle();

        if (usuarioExistente) {
          this.erro = 'Este e-mail já está cadastrado no OrganizAí. Por favor, faça login.';
          this.carregando = false;
          return;
        }
      } catch (e) {
        // Continua para o signUp principal do Supabase caso a tabela de profiles tenha RLS restritivo
      }

      // 6. Registro no Supabase Auth
      const data = await this.supabaseService.cadastrar(
        emailFormatado,
        this.senha,
        nomeFormatado
      );

      // Tratamento especial: se o Supabase tiver "identities" vazio, significa usuário já existente
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        this.erro = 'Este e-mail já possui uma conta cadastrada. Por favor, faça login.';
        this.carregando = false;
        return;
      }

      this.sucesso = 'Conta criada com sucesso! Redirecionando para o login...';

      // Limpa os campos
      this.nome = '';
      this.email = '';
      this.senha = '';
      this.confirmarSenha = '';

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1800);

    } catch (error: any) {
      console.error('Erro ao cadastrar:', error);

      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user_already_exists')) {
        this.erro = 'Este e-mail já está cadastrado. Faça login para acessar.';
      } else if (msg.includes('invalid email')) {
        this.erro = 'Endereço de e-mail inválido.';
      } else if (msg.includes('password')) {
        this.erro = 'A senha informada não atende aos requisitos do servidor.';
      } else {
        this.erro = error?.message || 'Não foi possível realizar o cadastro. Tente novamente.';
      }

    } finally {
      this.carregando = false;
    }
  }

  voltarParaLogin() {
    this.router.navigate(['/login']);
  }

}