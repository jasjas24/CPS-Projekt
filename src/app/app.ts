import { Component, inject, OnInit, signal, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

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
export class App implements OnInit, AfterViewInit {
  
  protected readonly title = signal('CPS-Projekt');
  protected readonly projekte = signal<Projekt[]>([]);
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  // Signals für die Navbar-Zustände
  readonly isNavbarShrunk = signal(false);
  readonly activeSection = signal('page-top');

  // Signals für den Intro Splash Screen
  protected readonly isIntroVisible = signal(true);
  protected readonly introSuffix = signal('');

  @ViewChild('bgVideo') videoRef!: ElementRef<HTMLVideoElement>;

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop || 0;

      // 1. Navbar-Hintergrund umschalten (nach 100 Pixeln Scrollweg)
      this.isNavbarShrunk.set(scrollPosition > 100);

      // 2. Eigener, schlanker Scrollspy für die Menüpunkte
      const sections = ['about', 'projects', 'signup'];
      let current = 'page-top';

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          // 80 Pixel Puffer (z.B. für die Höhe der Navbar)
          const elementTop = element.offsetTop - 80; 
          if (scrollPosition >= elementTop) {
            current = sectionId;
          }
        }
      }
      this.activeSection.set(current);
    }
  }

  ngOnInit(): void {
    // 1. Daten laden vom Backend
    this.http.get<Projekt[]>('http://localhost/cps-api/get_projekte.php')
      .subscribe({
        next: (daten) => {
          this.projekte.set(daten);
        },
        error: (fehler) => {
          console.error('Fehler beim Laden der Daten aus der Datenbank:', fehler);
        }
      });

    // 2. Intro-Animation steuern
    if (isPlatformBrowser(this.platformId)) {
      const words = ['fast', 'forward', 'better', 'botics'];
      let currentIndex = -1;

      const introInterval = setInterval(() => {
        currentIndex++;
        
        if (currentIndex < words.length) {
          this.introSuffix.set(words[currentIndex]);
        }

        if (currentIndex === words.length - 1) {
          clearInterval(introInterval);
          
          setTimeout(() => {
            this.isIntroVisible.set(false);
          }, 1000); 
        }
      }, 500);
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const video = this.videoRef?.nativeElement;
      if (video) {
        video.playbackRate = 0.5; 

        setTimeout(() => {
          video.play().catch(error => {
            console.warn("Browser blockiert Autoplay. Klicke einmal auf die Seite.", error);
          });
        }, 500);
      }
    }
  }

  handleVideoEnded(video: HTMLVideoElement): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        video.play().catch(() => {});
      }, 3000);
    }
  }
}