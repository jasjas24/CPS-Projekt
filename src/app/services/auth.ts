import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = 'http://localhost/cps-api';
  private platformId = inject(PLATFORM_ID);

  readonly isLoggedIn = signal<boolean>(false);
  readonly userRole = signal<string | null>(null);
  readonly currentUser = signal<any | null>(null);

  constructor(private http: HttpClient) {
    this.restoreFromStorage();
  }

  registerKunde(kundenDaten: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register.php`, kundenDaten);
  }

  login(loginDaten: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login.php`, loginDaten);
  }

  private restoreFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const role = localStorage.getItem('cps_auth_role');
    if (!role) {
      return;
    }

    const userRaw = localStorage.getItem('cps_auth_user');
    const user = userRaw ? JSON.parse(userRaw) : null;

    this.userRole.set(role);
    this.isLoggedIn.set(true);
    this.currentUser.set(user);
  }

  setLoginState(role: string, user: any = null) {
    this.userRole.set(role);
    this.isLoggedIn.set(true);
    this.currentUser.set(user);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('cps_auth_role', role);
      if (user) {
        localStorage.setItem('cps_auth_user', JSON.stringify(user));
      }
    }
  }

  logout() {
    this.userRole.set(null);
    this.isLoggedIn.set(false);
    this.currentUser.set(null);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('cps_auth_role');
      localStorage.removeItem('cps_auth_user');
    }
  }

  changePassword(payload: { email: string; newPassword: string; userType: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/change-password.php`, payload);
  }
}