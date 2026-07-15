import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, MitarbeiterProfile, KundeProfile } from '../services/auth';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profil.html',
  styleUrl: './profil.scss',
})
export class Profil implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  // Computed: Sichere Typ-Zugriffe auf den aktuellen Nutzer
  readonly userName = computed(() => {
    const user = this.authService.currentUser();
    return user ? `${user.vorname} ${user.nachname}` : '';
  });

  readonly userEmail = computed(() => {
    return this.authService.currentUser()?.email ?? '';
  });

  readonly userSince = computed(() => {
    return this.authService.currentUser()?.erstellt_am ?? '';
  });

  readonly mitarbeiterRolle = computed(() => {
    const user = this.authService.currentUser();
    if (user && this.isMitarbeiter(user)) {
      return user.rolle;
    }
    return '';
  });

  readonly kundennummer = computed(() => {
    const user = this.authService.currentUser();
    if (user && this.isKunde(user)) {
      return user.kundennummer;
    }
    return '';
  });

  readonly isRegistriert = computed(() => {
    const user = this.authService.currentUser();
    if (user && this.isKunde(user)) {
      return user.registriert;
    }
    return false;
  });

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.authService.currentUser()) {
      this.isLoading.set(false);
      return;
    }

    this.loadProfile();
  }

  loadProfile(): void {
    this.loadError.set(null);
    const email = this.getEmailFromStorage();
    const role = this.authService.userRole();

    if (!email || !role) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading.set(true);

    this.authService.getProfile({ email, userType: role })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response: any) => {
          if (response?.success === true) {
            this.authService.setLoginState(role, response.data);
          } else {
            this.loadError.set('Profildaten konnten nicht geladen werden.');
          }
        },
        error: (err: any) => {
          console.error('Fehler beim Laden des Profils:', err);
          this.loadError.set('Verbindungsfehler beim Laden der Profildaten.');
        },
      });
  }

  private getEmailFromStorage(): string | null {
    const savedUser = localStorage.getItem('cps_auth_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        return user.email ?? null;
      } catch {
        return null;
      }
    }
    return null;
  }

  isMitarbeiter(user: any): user is MitarbeiterProfile {
    return user !== null && 'rolle' in user;
  }

  isKunde(user: any): user is KundeProfile {
    return user !== null && 'kundennummer' in user;
  }

  // ── Admin-Aktionen ──
  onAdminUsers(): void {
    alert('Nutzer-Verwaltung – kommt bald.');
  }

  onAdminProjects(): void {
    this.router.navigate(['/dashboard']);
  }

  onAdminKanban(): void {
    this.router.navigate(['/kanban']);
  }

  onAdminLogs(): void {
    alert('Login-Logs – kommt bald.');
  }

  // ── Profil-Aktionen ──
  onEditProfile(): void {
    alert('Profil bearbeiten – kommt bald.');
  }

  onChangePassword(): void {
    alert('Passwort ändern – kommt bald.');
  }

  onShowDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}