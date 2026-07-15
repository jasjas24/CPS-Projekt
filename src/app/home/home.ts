import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Projekt {
  id: number;
  name: string;
  status: string;
  beschreibung: string;
}

type ContactFormModel = {
  name: string;
  email: string;
  firma: string;
  thema: string;
  nachricht: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  protected readonly title = signal('CPS-Projekt');
  protected readonly projekte = signal<Projekt[]>([]);

  readonly isNavbarShrunk = signal(false);
  readonly activeSection = signal('page-top');

  protected readonly isIntroVisible = signal(true);
  protected readonly introSuffix = signal('');

  readonly isSubmittingContact = signal(false);
  readonly contactSuccess = signal('');
  readonly contactError = signal('');

  readonly contactForm = signal<ContactFormModel>({
    name: '',
    email: '',
    firma: '',
    thema: '',
    nachricht: ''
  });

  @ViewChild('bgVideo') videoRef?: ElementRef<HTMLVideoElement>;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const scrollPosition = window.scrollY || document.documentElement.scrollTop || 0;
    this.isNavbarShrunk.set(scrollPosition > 100);

    const sections = ['page-top', 'about', 'projects', 'contact'];
    let current = 'page-top';

    for (const sectionId of sections) {
      const element = document.getElementById(sectionId);
      if (element) {
        const elementTop = element.offsetTop - 140;
        if (scrollPosition >= elementTop) {
          current = sectionId;
        }
      }
    }

    this.activeSection.set(current);
  }

  ngOnInit(): void {
    this.http.get<Projekt[]>('http://localhost/cps-api/get_projekte.php').subscribe({
      next: (daten) => {
        this.projekte.set(daten);
      },
      error: (fehler) => {
        console.error('Fehler beim Laden der Daten aus der Datenbank:', fehler);
      }
    });

    if (!isPlatformBrowser(this.platformId)) {
      this.isIntroVisible.set(false);
      return;
    }

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

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const video = this.videoRef?.nativeElement;
    if (!video) {
      return;
    }

    video.muted = true;
    video.defaultMuted = true;
    video.playbackRate = 0.5;

    video.play().catch((error) => {
      console.warn('Browser blockiert Autoplay trotz Stummschaltung.', error);
    });
  }

  handleVideoEnded(video: HTMLVideoElement): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    setTimeout(() => {
      video.play().catch(() => {});
    }, 3000);
  }

  updateContactField<K extends keyof ContactFormModel>(field: K, value: ContactFormModel[K]): void {
    this.contactForm.set({
      ...this.contactForm(),
      [field]: value
    });
  }

  submitContactForm(): void {
    this.contactSuccess.set('');
    this.contactError.set('');

    const form = this.contactForm();

    if (!form.name.trim() || !form.email.trim() || !form.nachricht.trim()) {
      this.contactError.set('Bitte fülle mindestens Name, E-Mail und Nachricht aus.');
      return;
    }

    this.isSubmittingContact.set(true);

    setTimeout(() => {
      this.isSubmittingContact.set(false);
      this.contactSuccess.set('Vielen Dank. Deine Anfrage wurde vorbereitet und kann jetzt ans Backend angebunden werden.');
      this.contactForm.set({
        name: '',
        email: '',
        firma: '',
        thema: '',
        nachricht: ''
      });
    }, 700);
  }
}