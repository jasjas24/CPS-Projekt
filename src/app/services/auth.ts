import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MitarbeiterProfile {
  id: number;
  vorname: string;
  nachname: string;
  email: string;
  rolle: string;
  erstellt_am: string;
}

export interface KundeProfile {
  id: number;
  vorname: string;
  nachname: string;
  email: string;
  kundennummer: string;
  registriert: boolean;
  erstellt_am: string;
}

export type UserProfile = MitarbeiterProfile | KundeProfile;

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = 'http://localhost/cps-api';

  constructor(private http: HttpClient) {
    // Beim Service-Start: Auth-State aus localStorage wiederherstellen
    this.restoreSession();
  }

  registerKunde(kundenDaten: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register.php`, kundenDaten);
  }

  login(loginDaten: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login.php`, loginDaten);
  }

  getProfile(payload: { email: string; userType: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/get-profile.php`, payload);
  }

  changePassword(payload: { email: string; newPassword: string; userType: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/change-password.php`, payload);
  }

  // Signals für den globalen Zustand
  readonly isLoggedIn = signal<boolean>(false);
  readonly userRole = signal<string | null>(null);
  readonly currentUser = signal<UserProfile | null>(null);

  /**
   * Stellt Session aus localStorage wieder her (z. B. nach Seitenneulad).
   */
  private restoreSession(): void {
    if (typeof window === 'undefined') return;

    const savedRole = localStorage.getItem('cps_auth_role');
    const savedUser = localStorage.getItem('cps_auth_user');

    if (savedRole && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.userRole.set(savedRole);
        this.currentUser.set(user);
        this.isLoggedIn.set(true);
      } catch {
        this.clearSession();
      }
    }
  }

  /**
   * Prüft, ob der aktuelle Nutzer ein Administrator ist.
   */
  isAdmin(): boolean {
    const user = this.currentUser();
    return this.userRole() === 'mitarbeiter' &&
           user !== null &&
           'rolle' in user &&
           (user as MitarbeiterProfile).rolle === 'Administrator';
  }

  // Methode, die nach erfolgreichem Backend-Abruf aufgerufen wird
  setLoginState(role: string, user: UserProfile | null = null) {
    this.userRole.set(role);
    this.isLoggedIn.set(true);
    this.currentUser.set(user);

    localStorage.setItem('cps_auth_role', role);
    if (user) {
      localStorage.setItem('cps_auth_user', JSON.stringify(user));
    }
  }

  logout() {
    this.userRole.set(null);
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.clearSession();
  }

  private clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('cps_auth_role');
    localStorage.removeItem('cps_auth_user');
  }
}