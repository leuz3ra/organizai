import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonInput,
  IonButton
} from '@ionic/angular/standalone';

import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonContent,
    IonInput,
    IonButton,
    FormsModule
  ],
})
export class HomePage {

  usuario: string = '';
  senha: string = '';

  constructor(
    private router: Router,
    private toastController: ToastController
  ) {}

  async fazerLogin() {

    if (this.usuario === 'admin' && this.senha === '123') {

      this.router.navigate(['/dashboard']);

    } else {

      await this.mostrarErro();

    }

  }

  async mostrarErro() {

    const toast = await this.toastController.create({
      message: 'Usuário ou senha incorretos.',
      duration: 3000,
      position: 'top',
      color: 'danger',
      icon: 'alert-circle-outline'
    });

    await toast.present();

  }

}