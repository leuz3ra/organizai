import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, addOutline, closeOutline, trashOutline,
  tvOutline, checkmarkCircleOutline, ellipseOutline,
  calendarOutline, chevronDownOutline, pauseOutline,
  playOutline, refreshOutline, searchOutline
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

// Simple Icons CDN: https://cdn.simpleicons.org/{slug}
// Com cor customizada: https://cdn.simpleicons.org/{slug}/{hex-sem-#}
const SI = 'https://cdn.simpleicons.org';

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
  { nome: 'Netflix',          logoUrl: `${SI}/netflix/E50914`,      cor: '#E50914', categoria: 'streaming',     valor: 39.90,  emoji: '🎬' },
  { nome: 'Disney+',          logoUrl: `${SI}/disneyplus/113CCF`,   cor: '#113CCF', categoria: 'streaming',     valor: 27.90,  emoji: '🏰' },
  { nome: 'Amazon Prime',     logoUrl: `${SI}/amazon/FF9900`,       cor: '#FF9900', categoria: 'streaming',     valor: 19.90,  emoji: '📦' },
  { nome: 'HBO Max',          logoUrl: `${SI}/hbo/5822B4`,          cor: '#5822B4', categoria: 'streaming',     valor: 34.90,  emoji: '🎭' },
  { nome: 'Apple TV+',        logoUrl: `${SI}/appletv/000000`,      cor: '#555555', categoria: 'streaming',     valor: 21.90,  emoji: '🍎' },
  { nome: 'Paramount+',       logoUrl: `${SI}/paramountplus/0064FF`,cor: '#0064FF', categoria: 'streaming',     valor: 19.90,  emoji: '⭐' },
  { nome: 'Globoplay',        logoUrl: `${SI}/globoplay/EA6C00`,    cor: '#EA6C00', categoria: 'streaming',     valor: 24.90,  emoji: '📺' },
  { nome: 'Crunchyroll',      logoUrl: `${SI}/crunchyroll/F47521`,  cor: '#F47521', categoria: 'streaming',     valor: 19.90,  emoji: '🍜' },
  // ── Música ───────────────────────────────────────────────────
  { nome: 'Spotify',          logoUrl: `${SI}/spotify/1DB954`,      cor: '#1DB954', categoria: 'musica',        valor: 21.90,  emoji: '🎵' },
  { nome: 'Apple Music',      logoUrl: `${SI}/applemusic/FC3C44`,   cor: '#FC3C44', categoria: 'musica',        valor: 21.90,  emoji: '🎶' },
  { nome: 'YouTube Music',    logoUrl: `${SI}/youtubemusic/FF0000`, cor: '#FF0000', categoria: 'musica',        valor: 16.90,  emoji: '🎧' },
  { nome: 'Deezer',           logoUrl: `${SI}/deezer/A238FF`,       cor: '#A238FF', categoria: 'musica',        valor: 16.90,  emoji: '🎼' },
  // ── Vídeo/Produtividade ───────────────────────────────────────
  { nome: 'YouTube Premium',  logoUrl: `${SI}/youtube/FF0000`,      cor: '#FF0000', categoria: 'streaming',     valor: 27.90,  emoji: '▶️' },
  // ── Jogos ─────────────────────────────────────────────────────
  { nome: 'Xbox Game Pass',   logoUrl: `${SI}/xbox/107C10`,         cor: '#107C10', categoria: 'jogos',         valor: 44.99,  emoji: '🎮' },
  { nome: 'PlayStation Plus', logoUrl: `${SI}/playstation/003791`,  cor: '#003791', categoria: 'jogos',         valor: 49.90,  emoji: '🎮' },
  { nome: 'Nintendo Switch',  logoUrl: `${SI}/nintendo/E4000F`,     cor: '#E4000F', categoria: 'jogos',         valor: 39.90,  emoji: '🕹️' },
  { nome: 'Steam',            logoUrl: `${SI}/steam/1B2838`,        cor: '#1B2838', categoria: 'jogos',         valor: 0,      emoji: '🎲' },
  // ── Produtividade ─────────────────────────────────────────────
  { nome: 'Adobe CC',         logoUrl: `${SI}/adobecreativecloud/FF0000`, cor: '#FF0000', categoria: 'produtividade', valor: 299.00, emoji: '🎨' },
  { nome: 'Microsoft 365',    logoUrl: `${SI}/microsoft/D83B01`,    cor: '#D83B01', categoria: 'produtividade', valor: 29.90,  emoji: '📋' },
  { nome: 'Notion',           logoUrl: `${SI}/notion/000000`,       cor: '#000000', categoria: 'produtividade', valor: 0,      emoji: '📝' },
  { nome: 'Canva Pro',        logoUrl: `${SI}/canva/7D2AE8`,        cor: '#7D2AE7', categoria: 'produtividade', valor: 54.99,  emoji: '🖌️' },
  { nome: 'Figma',            logoUrl: `${SI}/figma/F24E1E`,        cor: '#F24E1E', categoria: 'produtividade', valor: 0,      emoji: '🖼️' },
  { nome: 'Dropbox',          logoUrl: `${SI}/dropbox/0061FF`,      cor: '#0061FF', categoria: 'produtividade', valor: 24.90,  emoji: '📂' },
  { nome: 'iCloud',           logoUrl: `${SI}/icloud/3693F3`,       cor: '#3693F3', categoria: 'produtividade', valor: 5.90,   emoji: '☁️' },
  { nome: 'Google One',       logoUrl: `${SI}/google/4285F4`,       cor: '#4285F4', categoria: 'produtividade', valor: 6.99,   emoji: '☁️' },
  // ── Saúde / Educação ──────────────────────────────────────────
  { nome: 'Duolingo Plus',    logoUrl: `${SI}/duolingo/58CC02`,     cor: '#58CC02', categoria: 'noticias',      valor: 29.90,  emoji: '🦉' },
  { nome: 'Headspace',        logoUrl: `${SI}/headspace/F47F34`,    cor: '#F47F34', categoria: 'saude',         valor: 19.90,  emoji: '🧘' },
];

@Component({
  selector: 'app-assinaturas',
  standalone: true,
  templateUrl: './assinaturas.page.html',
  styleUrls: ['./assinaturas.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonIcon]
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
      playOutline, refreshOutline, searchOutline
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
  get contAtivas(): number  { return this.assinaturas.filter(a => a.status === 'ativo').length; }
  get contPausadas(): number { return this.assinaturas.filter(a => a.status === 'pausado').length; }

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
