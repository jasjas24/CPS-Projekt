import { Component, inject, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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
export class App implements OnInit, AfterViewInit { // AfterViewInit ist wieder brav an Bord
  
  protected readonly title = signal('CPS-Projekt');
  protected readonly projekte = signal<Projekt[]>([]);
  private http = inject(HttpClient);

  // Hiermit greifen wir sicher auf das #bgVideo aus dem HTML zu
  @ViewChild('bgVideo') videoRef!: ElementRef<HTMLVideoElement>;

  ngOnInit(): void {
    this.http.get<Projekt[]>('http://localhost/cps-api/get_projekte.php')
      .subscribe({
        next: (daten) => {
          this.projekte.set(daten);
        },
        error: (fehler) => {
          console.error('Fehler beim Laden der Daten aus der Datenbank:', fehler);
        }
      });
  }

  // Diese Funktion startet automatisch, sobald das HTML komplett bereit ist
  ngAfterViewInit(): void {
    const video = this.videoRef.nativeElement;
    video.playbackRate = 0.5; // Geschwindigkeit drosseln

    // Erstmaliger Start nach exakt 3 Sekunden
    setTimeout(() => {
      video.play().catch(error => {
        // Falls der Browser TROTZDEM blockiert, sehen wir es hier im Log und es crasht nichts
        console.warn("Browser blockiert Autoplay. Klicke einmal auf die Seite.", error);
      });
    }, 3000);
  }

  // Wird nach jedem vollständigen Ablauf aufgerufen
  handleVideoEnded(video: HTMLVideoElement): void {
    setTimeout(() => {
      video.play().catch(() => {});
    }, 3000); // 3 Sekunden Pause zwischen den Durchläufen
  }
}