import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {}

  ngOnInit() {
    const isDark = localStorage.getItem('temaEscuro') === 'true';
    document.body.classList.toggle('dark-mode', isDark);
  }
}
