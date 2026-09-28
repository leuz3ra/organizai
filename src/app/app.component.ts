import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor() {}

  async ngOnInit() {
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
