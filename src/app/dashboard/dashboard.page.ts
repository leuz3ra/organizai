import { CommonModule } from '@angular/common';

import {
  IonContent,
  IonButton,
  IonInput,
  IonIcon,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { addIcons } from 'ionicons';
import {
  logOutOutline,
  notificationsOutline,
  personCircleOutline,
  swapHorizontal,
  arrowForward,
  walletOutline,
  flagOutline,
  cardOutline,
  bulbOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [
  CommonModule,
  FormsModule,
  IonContent,
  IonButton,
  IonInput,
  IonIcon,
  IonSelect,
  IonSelectOption
  ]
})
export class DashboardPage {

  getImagemMoeda(codigo: string): string {

  const imagens: any = {
    BRL: 'assets/bandeiras/br.png',
    USD: 'assets/bandeiras/us.png',
    EUR: 'assets/bandeiras/eu.png',
    GBP: 'assets/bandeiras/gb.png',
    JPY: 'assets/bandeiras/jp.png'
  };

  return imagens[codigo];
  }

  getCorMoeda(codigo: string): string {

  const cores: any = {
    BRL: '#009c3b',
    USD: '#3c3b6e',
    EUR: '#003399',
    GBP: '#cf142b',
    JPY: '#bc002d'
  };

  return cores[codigo] || '#666';
}

converterBRL() {

  if (
    this.valorBRL === null ||
    this.valorBRL === undefined
  ) {

    this.valorUSD = null;
    return;

  }

  const taxas: any = {
    BRL: 1,
    USD: 5.50,
    EUR: 6.20,
    GBP: 7.30,
    JPY: 0.038
  };

  const valorBase =
    this.valorBRL * taxas[this.moedaOrigem];

  this.valorUSD = Number(
    (
      valorBase /
      taxas[this.moedaDestino]
    ).toFixed(2)
  );
}

  saudacao: string = '';

  // Conversor
  valorBRL: number | null = null;
  valorUSD: number | null = null;
  taxaDolar: number = 5.50;

  moedaOrigem = 'BRL';
  moedaDestino = 'USD';

  // Calculadora
  valorInicial: number | null = null;
  percentual: number | null = null;
  resultado: number | null = null;

  constructor(private router: Router) {

    addIcons({
      logOutOutline,
      notificationsOutline,
      personCircleOutline,
      swapHorizontal,
      arrowForward,
      walletOutline,
      flagOutline,
      cardOutline,
      bulbOutline
    });

    this.definirSaudacao();
  }

  definirSaudacao() {

    const hora = new Date().getHours();

    if (hora < 12) {
      this.saudacao = 'Bom dia, Jonas!';
    } else if (hora < 18) {
      this.saudacao = 'Boa tarde, Jonas!';
    } else {
      this.saudacao = 'Boa noite, Jonas!';
    }

  }

  

  inverterMoedas() {

    const moedaTemp = this.moedaOrigem;
    this.moedaOrigem = this.moedaDestino;
    this.moedaDestino = moedaTemp;

    const valorTemp = this.valorBRL;
    this.valorBRL = this.valorUSD;
    this.valorUSD = valorTemp;

    this.converterBRL();
  }

  calcularPercentual() {

  if (
    this.valorInicial === null ||
    this.percentual === null
  ) {
    return;
  }

  this.resultado =
    this.valorInicial +
    (this.valorInicial * this.percentual / 100);

}

adicionarPercentual() {

  if (
    this.valorInicial === null ||
    this.percentual === null
  ) {
    return;
  }

  this.resultado =
    this.valorInicial +
    (this.valorInicial * this.percentual / 100);

}

tirarPercentual() {

  if (
    this.valorInicial === null ||
    this.percentual === null
  ) {
    return;
  }

  this.resultado =
    this.valorInicial -
    (this.valorInicial * this.percentual / 100);

}

  mostrarLogout = false;

  logout() {
    this.mostrarLogout = true;
  }

  confirmarLogout() {

    this.mostrarLogout = false;

    this.router.navigate(['/home']);

  }

  cancelarLogout() {

    this.mostrarLogout = false;

  }

  abrirRendas() {
    this.router.navigate(['/rendas']);
  }

  abrirMetas() {
    this.router.navigate(['/metas']);
  }

  abrirPagamentos() {
    alert('Tela de Pagamentos em desenvolvimento.');
  }

  abrirDicas() {
    alert('Tela de Dicas em desenvolvimento.');
  }

  moedas = [
  {
    codigo: 'BRL',
    bandeira: '🇧🇷',
    cor: '#2ca01c'
  },
  {
    codigo: 'USD',
    bandeira: '🇺🇸',
    cor: '#7165ff'
  },
  {
    codigo: 'EUR',
    bandeira: '🇪🇺',
    cor: '#0057b8'
  },
  {
    codigo: 'GBP',
    bandeira: '🇬🇧',
    cor: '#cf142b'
  },
  {
    codigo: 'JPY',
    bandeira: '🇯🇵',
    cor: '#bc002d'
  }
];
}

