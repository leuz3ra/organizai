import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, searchOutline, closeOutline,
  bookmark, bookmarkOutline, bulbOutline, chevronForwardOutline,
  trophyOutline, checkmarkCircle, closeCircle,
  trendingUpOutline, shieldCheckmarkOutline, pieChartOutline, cutOutline, barChartOutline, homeOutline
} from 'ionicons/icons';

export interface Dica {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string; // Markdown
  leitura: number;
  icon: string;
  salva?: boolean;
}

interface QuizQuestion {
  pergunta: string;
  opcoes: string[];
  respostaCerta: number; // index
}

const DICAS_MOCK: Dica[] = [
  { id: '1', titulo: 'O poder dos Juros Compostos', resumo: 'Entenda como o tempo multiplica seu dinheiro nos investimentos.', leitura: 3, icon: 'trending-up-outline' , conteudo: '### O que são juros compostos?\nSão os juros sobre juros. Diferente dos juros simples, aqui o rendimento de um mês é somado ao capital para calcular o rendimento do mês seguinte.\n\n**Exemplo prático:**\nSe você investe R$ 1.000 a 1% ao mês, no primeiro mês ganha R$ 10. No segundo mês, os 1% incidem sobre R$ 1.010, rendendo R$ 10,10. A longo prazo, a curva de crescimento é exponencial!\n\n> *“Os juros compostos são a oitava maravilha do mundo.”* - Albert Einstein' },
  { id: '2', titulo: 'Reserva de Emergência: Onde deixar?', resumo: 'Opções seguras e com liquidez diária para sua reserva.', leitura: 4, icon: 'shield-checkmark-outline' , conteudo: '### Características de um bom investimento para reserva\n1. **Alta Liquidez:** Você precisa sacar o dinheiro a qualquer momento.\n2. **Baixo Risco:** O principal não pode oscilar muito para baixo.\n\n### Melhores opções atuais:\n- **Tesouro Selic:** Título público mais seguro do país.\n- **CDBs de liquidez diária (100% CDI):** Oferecidos por bancos como Nubank, Inter, Itaú.\n- **Contas remuneradas:** Carteiras digitais como Mercado Pago ou PicPay (leia as regras do FGC).' },
  { id: '3', titulo: 'A regra 50/30/20', resumo: 'Um método simples para dividir seu salário e nunca faltar dinheiro.', leitura: 3, icon: 'pie-chart-outline' , conteudo: '### Como funciona a divisão?\n\n- **50% Necessidades:** Moradia, contas fixas (água, luz, internet), mercado essencial, transporte.\n- **30% Desejos:** Lazer, assinaturas (Netflix, Spotify), delivery, compras não essenciais.\n- **20% Futuro:** Quitação de dívidas, montagem da reserva de emergência, investimentos.\n\n*Ajuste as porcentagens para a sua realidade, mas tente manter sempre uma fatia para investimentos e pagamentos de dívidas!*' },
  { id: '4', titulo: 'Como cortar gastos invisíveis', resumo: 'Aquelas pequenas compras que corroem seu orçamento no final do mês.', leitura: 2, icon: 'cut-outline' , conteudo: '### O que são gastos invisíveis?\nSão aqueles gastos diários pequenos que você não percebe, mas somam muito no final do mês. O clássico cafezinho após o almoço, as tarifas bancárias, assinaturas que você não usa.\n\n**Ação prática de hoje:**\n- Revise sua fatura do cartão.\n- Cancele 1 assinatura que não usa há mais de 2 meses.\n- Troque seu pacote bancário para os Serviços Essenciais (é lei, é gratuito!).' },
  { id: '5', titulo: 'O que é a Taxa Selic?', resumo: 'Como a taxa básica de juros afeta seu bolso na prática.', leitura: 5, icon: 'bar-chart-outline' , conteudo: '### O "controle do dinheiro"\nA Selic é a taxa básica da economia brasileira. Ela é o principal instrumento do Banco Central para controlar a inflação.\n\n- **Selic Alta:** Crédito fica mais caro (ruim para empréstimos) e investimentos em Renda Fixa rendem mais.\n- **Selic Baixa:** Crédito fica mais barato (bom para financiamentos) e Renda Fixa rende menos, empurrando as pessoas para a Bolsa de Valores.' },
  { id: '6', titulo: 'Amortização de Financiamento', resumo: 'Descubra por que amortizar no prazo reduz drasticamente os juros pagos.', leitura: 4, icon: 'home-outline' , conteudo: '### O segredo das tabelas PRICE e SAC\nQuando você paga a parcela normal, grande parte do valor vai para os **juros** e pouco abate a dívida principal.\n\nQuando você **amortiza** (dá um dinheiro extra), 100% do valor reduz o saldo devedor.\n\n**Onde amortizar?**\nSempre escolha reduzir o **PRAZO** em vez de reduzir o valor da parcela. Isso corta os meses finais do contrato, eliminando todos os juros que você pagaria naqueles meses!' }
];

const QUIZ_QUESTIONS: QuizQuestion[] = [
  { pergunta: 'Qual a principal característica de onde guardar a Reserva de Emergência?', opcoes: ['Alto rendimento na Bolsa', 'Alta liquidez e baixo risco', 'Bloqueio de 3 anos', 'Isenção total de impostos'], respostaCerta: 1 },
  { pergunta: 'Na regra 50-30-20, o que representam os 20%?', opcoes: ['Desejos e Lazer', 'Aluguel e Mercado', 'Investimentos e Dívidas', 'Impostos'], respostaCerta: 2 },
  { pergunta: 'O que é Amortizar um financiamento reduzindo prazo?', opcoes: ['Pagar o valor normal da fatura', 'Pagar juros antecipados', 'Reduzir o saldo devedor principal eliminando juros futuros', 'Aumentar a dívida no banco'], respostaCerta: 2 }
];

@Component({
  selector: 'app-dicas',
  standalone: true,
  templateUrl: './dicas.page.html',
  styleUrls: ['./dicas.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonIcon]
})
export class DicasPage implements OnInit {

  dicas: Dica[] = [...DICAS_MOCK];
  termoBusca = '';
  apenasSalvas = false;
  dicaAberta: Dica | null = null;

  // Quiz State
  mostrarQuizModal = false;
  quizIndex = 0;
  quizScore = 0;
  quizFinalizado = false;
  quizQuestions = QUIZ_QUESTIONS;
  respostaSelecionada: number | null = null;
  quizCorreto: boolean | null = null;

  constructor(private router: Router) {
    addIcons({
      arrowBackOutline, searchOutline, closeOutline,
      bookmark, bookmarkOutline, bulbOutline, chevronForwardOutline,
      trophyOutline, checkmarkCircle, closeCircle,
      trendingUpOutline, shieldCheckmarkOutline, pieChartOutline, cutOutline, barChartOutline, homeOutline
    });
  }

  ngOnInit() {
    this.carregarSalvas();
  }

  carregarSalvas() {
    try {
      const salvasLS = JSON.parse(localStorage.getItem('organizai_dicas_salvas') || '[]');
      this.dicas.forEach(d => {
        d.salva = salvasLS.includes(d.id);
      });
    } catch { }
  }

  salvarLS() {
    const salvasLS = this.dicas.filter(d => d.salva).map(d => d.id);
    localStorage.setItem('organizai_dicas_salvas', JSON.stringify(salvasLS));
  }

  get dicasFiltradas(): Dica[] {
    let list = this.dicas;
    if (this.apenasSalvas) {
      list = list.filter(d => d.salva);
    }
    const t = this.termoBusca.toLowerCase().trim();
    if (t) {
      list = list.filter(d => d.titulo.toLowerCase().includes(t) || d.resumo.toLowerCase().includes(t));
    }
    return list;
  }

  get totalSalvas(): number {
    return this.dicas.filter(d => d.salva).length;
  }

  toggleSalvar(d: Dica, ev?: Event) {
    if (ev) ev.stopPropagation();
    d.salva = !d.salva;
    this.salvarLS();
  }

  abrirDica(d: Dica) {
    this.dicaAberta = d;
  }

  fecharDica() {
    this.dicaAberta = null;
  }

  // --- QUIZ LOGIC ---

  abrirQuiz() {
    this.quizIndex = 0;
    this.quizScore = 0;
    this.quizFinalizado = false;
    this.respostaSelecionada = null;
    this.quizCorreto = null;
    this.mostrarQuizModal = true;
  }

  fecharQuiz() {
    this.mostrarQuizModal = false;
  }

  responder(idx: number) {
    if (this.respostaSelecionada !== null) return;
    this.respostaSelecionada = idx;
    const isCerto = idx === this.quizQuestions[this.quizIndex].respostaCerta;
    this.quizCorreto = isCerto;
    if (isCerto) this.quizScore++;
    
    setTimeout(() => {
      this.proximaPergunta();
    }, 1500);
  }

  proximaPergunta() {
    this.respostaSelecionada = null;
    this.quizCorreto = null;
    if (this.quizIndex < this.quizQuestions.length - 1) {
      this.quizIndex++;
    } else {
      this.quizFinalizado = true;
    }
  }

  renderMarkdown(text: string): string {
    if (!text) return '';
    let html = text;
    html = html.replace(/### (.*)/g, '<h3>$1</h3>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/> \*(.*?)\*/g, '<blockquote>$1</blockquote>');
    html = html.replace(/- (.*)/g, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/\n\n/g, '<br><br>');
    return html;
  }

  voltar() {
    this.router.navigate(['/dashboard']);
  }
}
