import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // HTTP-Client importieren

// Wir definieren einen Typ (Interface), damit TypeScript weiß, wie ein Projekt aussieht
interface Projekt {
  id: number;
  name: string;
  status: string;
  beschreibung: string;
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('CPS-Projekt');
  
  // Wir starten mit einem leeren Array im Signal
  protected readonly projekte = signal<Projekt[]>([]);

  // Moderne Angular-Art, um Dienste zu injizieren (Dependency Injection)
  private http = inject(HttpClient);

  ngOnInit(): void {
    // Sobald die App startet, rufen wir die Daten vom PHP-Backend ab
    this.http.get<Projekt[]>('http://localhost/cps-api/get_projekte.php')
      .subscribe({
        next: (daten) => {
          // Wir befüllen unser Signal mit den echten Datenbank-Daten!
          this.projekte.set(daten);
        },
        error: (fehler) => {
          console.error('Fehler beim Laden der Daten aus der Datenbank:', fehler);
        }
      });
  }
}