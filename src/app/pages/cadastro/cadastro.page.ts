import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class CadastroPage {

  nome = '';
  email = '';
  senha = '';
  confirmarSenha = '';

  carregando = false;
  erro = '';
  sucesso = '';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async cadastrar() {

    this.erro = '';
    this.sucesso = '';

    if (!this.nome || !this.email || !this.senha || !this.confirmarSenha) {
      this.erro = 'Preencha todos os campos.';
      return;
    }

    if (this.senha !== this.confirmarSenha) {
      this.erro = 'As senhas não coincidem.';
      return;
    }

    if (this.senha.length < 6) {
      this.erro = 'A senha deve ter pelo menos 6 caracteres.';
      return;
    }

    this.carregando = true;

    try {

      const data = await this.supabaseService.cadastrar(
        this.email,
        this.senha,
        this.nome
      );

      console.log('Cadastro realizado:', data);

      this.sucesso =
        'Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.';

      this.nome = '';
      this.email = '';
      this.senha = '';
      this.confirmarSenha = '';

    } catch (error: any) {

      console.error('Erro ao cadastrar:', error);

      this.erro =
        error?.message ||
        'Não foi possível realizar o cadastro.';

    } finally {

      this.carregando = false;

    }
  }

  voltarParaLogin() {
    this.router.navigate(['/login']);
  }

}