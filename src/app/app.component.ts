import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

import { SupabaseService } from './services/supabase.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [CommonModule, IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  carregandoRota = false;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.carregandoRota = true;
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        setTimeout(() => {
          this.carregandoRota = false;
        }, 220);
      }
    });

    this.supabaseService.supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY' && !this.router.url.includes('redefinir-senha')) {
        await this.supabaseService.processarTokensUrl();
        const fragment = typeof window !== 'undefined' && window.location.hash ? window.location.hash.substring(1) : undefined;
        this.router.navigate(['/redefinir-senha'], {
          replaceUrl: true,
          fragment,
          queryParamsHandling: 'preserve'
        });
      }
    });
  }

  async ngOnInit() {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (
        ((hash.includes('type=recovery') && hash.includes('access_token')) ||
         (search.includes('type=recovery') && search.includes('code'))) &&
        !window.location.pathname.includes('/redefinir-senha')
      ) {
        await this.supabaseService.processarTokensUrl();
        const fragment = hash ? hash.substring(1) : undefined;
        this.router.navigate(['/redefinir-senha'], {
          replaceUrl: true,
          fragment,
          queryParamsHandling: 'preserve'
        });
      }
    }



    const isDark = localStorage.getItem('temaEscuro') === 'true';
    document.body.classList.toggle('dark-mode', isDark);

    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.setStyle({
          style: isDark ? Style.Dark : Style.Light
        });
      } catch (e) {
        console.warn('StatusBar styling not supported on this platform:', e);
      }
    }
  }
}

