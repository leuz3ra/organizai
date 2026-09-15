import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, addOutline, closeOutline, trashOutline,
  tvOutline, checkmarkCircleOutline, ellipseOutline,
  calendarOutline, chevronDownOutline, pauseOutline,
  playOutline, refreshOutline, searchOutline, banOutline
} from 'ionicons/icons';

export type CicloAssinatura = 'mensal' | 'anual' | 'semanal';
export type StatusAssinatura = 'ativo' | 'pausado' | 'cancelado';
export type CategoriaAssinatura = 'streaming' | 'musica' | 'jogos' | 'produtividade' | 'noticias' | 'saude' | 'outros';

export interface Assinatura {
  id: string;
  nome: string;
  valor: number;
  ciclo: CicloAssinatura;
  dataRenovacao: string;
  status: StatusAssinatura;
  categoria: CategoriaAssinatura;
  emoji: string;         // usado quando não é serviço popular
  logoUrl?: string;      // URL da logo oficial (Simple Icons CDN)
  cor: string;
  criadoEm: string;
}

const FAV = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

export interface ServicoPopular {
  nome: string;
  logoUrl: string;
  cor: string;
  categoria: CategoriaAssinatura;
  valor: number;
  emoji: string; // fallback
}

export const SERVICOS_POPULARES: ServicoPopular[] = [
  // ── Streaming de Vídeo ───────────────────────────────────────
  { nome: 'Netflix',          logoUrl: FAV('netflix.com'),          cor: '#E50914', categoria: 'streaming',     valor: 39.90,  emoji: '🎬' },
  { nome: 'Disney+',          logoUrl: FAV('disneyplus.com'),       cor: '#113CCF', categoria: 'streaming',     valor: 27.90,  emoji: '🏰' },
  { nome: 'Amazon Prime',     logoUrl: FAV('primevideo.com'),       cor: '#FF9900', categoria: 'streaming',     valor: 19.90,  emoji: '📦' },
  { nome: 'Max (HBO)',        logoUrl: FAV('max.com'),              cor: '#002BE7', categoria: 'streaming',     valor: 34.90,  emoji: '🎭' },
  { nome: 'Apple TV+',        logoUrl: FAV('tv.apple.com'),         cor: '#555555', categoria: 'streaming',     valor: 21.90,  emoji: '🍎' },
  { nome: 'Paramount+',       logoUrl: FAV('paramountplus.com'),    cor: '#0064FF', categoria: 'streaming',     valor: 19.90,  emoji: '⭐' },
  { nome: 'Globoplay',        logoUrl: FAV('globoplay.globo.com'),  cor: '#EA6C00', categoria: 'streaming',     valor: 24.90,  emoji: '📺' },
  { nome: 'Crunchyroll',      logoUrl: FAV('crunchyroll.com'),      cor: '#F47521', categoria: 'streaming',     valor: 19.90,  emoji: '🍜' },
  // ── Música ───────────────────────────────────────────────────
  { nome: 'Spotify',          logoUrl: FAV('spotify.com'),          cor: '#1DB954', categoria: 'musica',        valor: 21.90,  emoji: '🎵' },
  { nome: 'Apple Music',      logoUrl: FAV('music.apple.com'),      cor: '#FC3C44', categoria: 'musica',        valor: 21.90,  emoji: '🎶' },
  { nome: 'YouTube Music',    logoUrl: FAV('music.youtube.com'),    cor: '#FF0000', categoria: 'musica',        valor: 16.90,  emoji: '🎧' },
  { nome: 'Deezer',           logoUrl: FAV('deezer.com'),           cor: '#A238FF', categoria: 'musica',        valor: 16.90,  emoji: '🎼' },
  // ── Produtividade & Tech ─────────────────────────────────────
  { nome: 'Canva Pro',        logoUrl: FAV('canva.com'),            cor: '#7D2AE7', categoria: 'produtividade', valor: 54.99,  emoji: '🖌️' },
  { nome: 'Figma',            logoUrl: FAV('figma.com'),            cor: '#F24E1E', categoria: 'produtividade', valor: 0,      emoji: '🖼️' },
  { nome: 'Dropbox',          logoUrl: FAV('dropbox.com'),          cor: '#0061FF', categoria: 'produtividade', valor: 24.90,  emoji: '📂' },
  { nome: 'iCloud',           logoUrl: FAV('icloud.com'),           cor: '#3693F3', categoria: 'produtividade', valor: 5.90,   emoji: '☁️' },
  { nome: 'Google One',       logoUrl: FAV('one.google.com'),       cor: '#4285F4', categoria: 'produtividade', valor: 6.99,   emoji: '☁️' },
  { nome: 'ChatGPT Plus',     logoUrl: FAV('chatgpt.com'),          cor: '#10A37F', categoria: 'outros',        valor: 100.00, emoji: '🤖' },
  // ── Saúde & Educação ─────────────────────────────────────────
  { nome: 'Duolingo Plus',    logoUrl: FAV('duolingo.com'),         cor: '#58CC02', categoria: 'noticias',      valor: 29.90,  emoji: '🦉' },
  { nome: 'Headspace',        logoUrl: FAV('headspace.com'),        cor: '#F47F34', categoria: 'saude',         valor: 19.90,  emoji: '🧘' },
  { nome: 'Strava',           logoUrl: FAV('strava.com'),           cor: '#FC4C02', categoria: 'saude',         valor: 15.90,  emoji: '🚴' },
  // ── Jogos ────────────────────────────────────────────────────
  { nome: 'Xbox Game Pass',   logoUrl: FAV('xbox.com'),             cor: '#107C10', categoria: 'jogos',         valor: 34.99,  emoji: '🎮' },
  { nome: 'PlayStation Plus', logoUrl: FAV('playstation.com'),      cor: '#00439C', categoria: 'jogos',         valor: 34.90,  emoji: '🕹️' },
  { nome: 'Nintendo Switch',  logoUrl: FAV('nintendo.com'),         cor: '#E60012', categoria: 'jogos',         valor: 20.00,  emoji: '🍄' },
];

@Component({
  selector: 'app-assinaturas',
  standalone: true,
  templateUrl: './assinaturas.page.html',
  styleUrls: ['./assinaturas.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSelect, IonSelectOption]
})
export class AssinaturasPage implements OnInit {

  assinaturas: Assinatura[] = [];
  filtroStatus: 'todos' | StatusAssinatura = 'todos';
  mostrarModal = false;
  mostrarConfirmacao = false;
  mostrarSugestoes = false;
  idParaExcluir: string | null = null;
  erroForm = '';
  buscaSugestao = '';

  readonly categorias: { valor: CategoriaAssinatura; label: string }[] = [
    { valor: 'streaming',     label: 'Streaming de Vídeo' },
    { valor: 'musica',        label: 'Música' },
    { valor: 'jogos',         label: 'Jogos' },
    { valor: 'produtividade', label: 'Produtividade' },
    { valor: 'noticias',      label: 'Notícias / Leitura' },
    { valor: 'saude',         label: 'Saúde / Bem-estar' },
    { valor: 'outros',        label: 'Outros' },
  ];

  readonly todosServicos = SERVICOS_POPULARES;
  readonly diasMes = Array.from({length: 31}, (_, i) => i + 1);

  get servicosFiltrados(): ServicoPopular[] {
    const t = this.buscaSugestao.toLowerCase().trim();
    if (!t) return this.todosServicos;
    return this.todosServicos.filter(s => s.nome.toLowerCase().includes(t));
  }

  novaForm: {
    nome: string;
    valor: number | undefined;
    ciclo: CicloAssinatura;
    categoria: CategoriaAssinatura;
    emoji: string;
    logoUrl: string;
    cor: string;
    diaRenovacao: number;
    isPopular: boolean;
    mostrarOutro: boolean;
  } = this.formVazio();

  // Se o serviço tem logo oficial (não é customizado)
  get temLogoForm(): boolean { return !!this.novaForm.logoUrl && this.novaForm.isPopular; }

  constructor(private router: Router) {
    addIcons({
      arrowBackOutline, addOutline, closeOutline, trashOutline,
      tvOutline, checkmarkCircleOutline, ellipseOutline,
      calendarOutline, chevronDownOutline, pauseOutline,
      playOutline, refreshOutline, searchOutline, banOutline
    });
  }

  ngOnInit() { this.carregar(); }
  ionViewWillEnter() { this.carregar(); }

  // ── CRUD ───────────────────────────────────────────────────

  carregar() {
    try {
      const raw = localStorage.getItem('organizai_assinaturas');
      this.assinaturas = raw ? JSON.parse(raw) : this.dadosIniciais();
    } catch { this.assinaturas = this.dadosIniciais(); }
  }

  salvarLS() {
    localStorage.setItem('organizai_assinaturas', JSON.stringify(this.assinaturas));
  }

  dadosIniciais(): Assinatura[] {
    return [];
  }

  // ── COMPUTED ───────────────────────────────────────────────

  get filtradas(): Assinatura[] {
    return this.filtroStatus === 'todos'
      ? this.assinaturas
      : this.assinaturas.filter(a => a.status === this.filtroStatus);
  }

  get totalMensal(): number {
    return this.assinaturas.filter(a => a.status === 'ativo').reduce((s, a) => s + this.valorMensal(a), 0);
  }
  get totalAnual(): number { return this.totalMensal * 12; }
  get contAtivas(): number    { return this.assinaturas.filter(a => a.status === 'ativo').length; }
  get contPausadas(): number  { return this.assinaturas.filter(a => a.status === 'pausado').length; }
  get contCanceladas(): number { return this.assinaturas.filter(a => a.status === 'cancelado').length; }

  valorMensal(a: Assinatura): number {
    const v = Number(a.valor);
    if (a.ciclo === 'anual')   return Number((v / 12).toFixed(2));
    if (a.ciclo === 'semanal') return Number((v * 4.33).toFixed(2));
    return v;
  }

  getLabelCiclo(c: CicloAssinatura): string {
    return c === 'mensal' ? '/mês' : c === 'anual' ? '/ano' : '/sem';
  }

  getProximaRenovacao(a: Assinatura): string {
    const hoje = new Date();
    const dia = parseInt(a.dataRenovacao, 10);
    let d = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
    if (d <= hoje) d = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  getDiasParaRenovacao(a: Assinatura): number {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const dia = parseInt(a.dataRenovacao, 10);
    let d = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
    if (d <= hoje) d = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
    return Math.ceil((d.getTime() - hoje.getTime()) / 86400000);
  }

  // ── TOGGLE STATUS ──────────────────────────────────────────

  toggleStatus(a: Assinatura) {
    a.status = a.status === 'ativo' ? 'pausado' : 'ativo';
    this.salvarLS();
  }

  cancelarAssinatura(a: Assinatura, e: Event) {
    e.stopPropagation();
    a.status = 'cancelado';
    this.salvarLS();
  }

  descancelarAssinatura(a: Assinatura, e: Event) {
    e.stopPropagation();
    a.status = 'ativo'; // Default to ativo upon reactivation
    this.salvarLS();
  }

  // ── EXCLUIR ────────────────────────────────────────────────

  iniciarExcluir(id: string, e: Event) { e.stopPropagation(); this.idParaExcluir = id; this.mostrarConfirmacao = true; }
  confirmarExclusao() {
    if (this.idParaExcluir) { this.assinaturas = this.assinaturas.filter(a => a.id !== this.idParaExcluir); this.salvarLS(); }
    this.mostrarConfirmacao = false; this.idParaExcluir = null;
  }
  cancelarExclusao() { this.mostrarConfirmacao = false; this.idParaExcluir = null; }

  // ── MODAL ─────────────────────────────────────────────────

  abrirModal() {
    this.novaForm = this.formVazio();
    this.erroForm = '';
    this.buscaSugestao = '';
    this.mostrarModal = true;
    this.mostrarSugestoes = true; // Mostra sugestões por padrão
  }

  fecharModal() { this.mostrarModal = false; }

  selecionarSugestao(s: ServicoPopular) {
    this.novaForm.nome       = s.nome;
    this.novaForm.emoji      = s.emoji;
    this.novaForm.logoUrl    = s.logoUrl;
    this.novaForm.cor        = s.cor;
    this.novaForm.categoria  = s.categoria;
    this.novaForm.valor      = s.valor || undefined;
    this.novaForm.isPopular  = true;
    this.mostrarSugestoes    = false;
    this.buscaSugestao       = '';
  }

  limparServico() {
    this.novaForm.nome      = '';
    this.novaForm.logoUrl   = '';
    this.novaForm.emoji     = '📱';
    this.novaForm.cor       = '#555555';
    this.novaForm.isPopular = false;
    this.novaForm.mostrarOutro = true; // Abre o form de "Outros"
    this.mostrarSugestoes = false;
  }

  salvar() {
    this.erroForm = '';
    if (!this.novaForm.nome?.trim()) { this.erroForm = 'Informe o nome do serviço.'; return; }
    if (!this.novaForm.valor || this.novaForm.valor <= 0) { this.erroForm = 'Informe um valor válido.'; return; }

    const nova: Assinatura = {
      id: this.id(),
      nome: this.novaForm.nome.trim(),
      valor: Number(this.novaForm.valor),
      ciclo: this.novaForm.ciclo || 'mensal',
      dataRenovacao: String(this.novaForm.diaRenovacao || 1),
      status: 'ativo',
      categoria: this.novaForm.categoria || 'outros',
      emoji: this.novaForm.emoji || '📱',
      logoUrl: this.novaForm.isPopular ? this.novaForm.logoUrl : undefined,
      cor: this.novaForm.cor || '#555555',
      criadoEm: new Date().toISOString()
    };

    this.assinaturas.unshift(nova);
    this.salvarLS();
    this.fecharModal();
  }

  // ── UTILS ──────────────────────────────────────────────────

  formVazio() {
    return { nome: '', emoji: '📱', logoUrl: '', cor: '#555555', valor: undefined as number | undefined, ciclo: 'mensal' as CicloAssinatura, categoria: 'outros' as CategoriaAssinatura, diaRenovacao: 1, isPopular: false, mostrarOutro: false };
  }

  onLogoError(a: Assinatura) { a.logoUrl = undefined; }

  fmt(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private id(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  voltar() { this.router.navigate(['/pagamentos']); }
  setFiltro(f: 'todos' | StatusAssinatura) { this.filtroStatus = f; }
}
