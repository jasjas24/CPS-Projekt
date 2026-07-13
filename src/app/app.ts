import {
  Component,
  inject,
  OnInit,
  signal,
  PLATFORM_ID,
  HostListener
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth';

interface Projekt {
  id: number;
  name: string;
  status: string;
  beschreibung: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  protected readonly authService = inject(AuthService);

  readonly isLogin = signal(false);
  readonly isProfil = signal(false);
  readonly isDashboard = signal(false);

  protected readonly title = signal('CPS-Projekt');
  protected readonly projekte = signal<Projekt[]>([]);

  readonly isHome = signal(true);
  readonly isAppReady = signal(false);

  readonly isNavbarShrunk = signal(false);
  readonly activeSection = signal('page-top');

  protected readonly isIntroVisible = signal(true);
  protected readonly introSuffix = signal('');

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const scrollPosition = window.scrollY || document.documentElement.scrollTop || 0;

    if (this.isLogin()) {
      this.isNavbarShrunk.set(false);
      this.activeSection.set('page-top');
      return;
    }

    if (this.isHome()) {
      this.isNavbarShrunk.set(scrollPosition > 100);

      const sections = ['about', 'projects', 'signup'];
      let current = 'page-top';

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const elementTop = element.offsetTop - 80;
          if (scrollPosition >= elementTop) {
            current = sectionId;
          }
        }
      }

      this.activeSection.set(current);
      return;
    }

    this.isNavbarShrunk.set(scrollPosition > 100);
    this.activeSection.set('page-top');
  }

  ngOnInit(): void {
    this.updateRouteState(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateRouteState(event.urlAfterRedirects);
      });

    this.http.get<Projekt[]>('http://localhost/cps-api/get_projekte.php')
      .subscribe({
        next: (daten) => {
          this.projekte.set(daten);
        },
        error: (fehler) => {
          console.error('Fehler beim Laden der Projekte aus der Datenbank:', fehler);
        }
      });

    if (!isPlatformBrowser(this.platformId)) {
      this.isIntroVisible.set(false);
      return;
    }

    const introAlreadyPlayed = sessionStorage.getItem('introPlayed');

    if (introAlreadyPlayed === 'true') {
      this.isIntroVisible.set(false);
      this.isAppReady.set(true);
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
          this.isAppReady.set(true);
          sessionStorage.setItem('introPlayed', 'true');
        }, 1000);
      }
    }, 500);
  }

  onSettingsClick(): void {
    this.router.navigate(['/profil']);
  }

  onLogoutClick(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  private updateRouteState(url: string): void {
    const cleanUrl = url.split('?')[0].split('#')[0];

    this.isHome.set(cleanUrl === '/');
    this.isLogin.set(cleanUrl === '/login');
    this.isProfil.set(cleanUrl === '/profil');
    this.isDashboard.set(cleanUrl === '/dashboard');

    if (this.isLogin()) {
      this.isNavbarShrunk.set(false);
      this.activeSection.set('page-top');
    } else {
      const scrollPosition = isPlatformBrowser(this.platformId)
        ? window.scrollY || document.documentElement.scrollTop || 0
        : 0;

      this.isNavbarShrunk.set(scrollPosition > 100);
      this.activeSection.set('page-top');
    }

    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.toggle('login-no-scroll', this.isLogin());
    }
  }
}