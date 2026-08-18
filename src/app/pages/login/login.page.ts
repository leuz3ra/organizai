import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class LoginPage {

  email = '';
  senha = '';

  carregando = false;
  erro = '';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async entrar() {

    this.erro = '';

    if (!this.email || !this.senha) {
      this.erro = 'Preencha o e-mail e a senha.';
      return;
    }

    this.carregando = true;

    try {

      await this.supabaseService.login(
        this.email,
        this.senha
      );

      console.log('Login realizado com sucesso!');

      await this.router.navigate(['/dashboard']);

    } catch (error: any) {

      console.error('Erro ao fazer login:', error);

      this.erro =
        error?.message ||
        'Não foi possível fazer login.';

    } finally {

      this.carregando = false;

    }
  }

  irParaCadastro() {
    this.router.navigate(['/cadastro']);
  }

}