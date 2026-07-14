import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs/operators';

type AuthMode = 'login' | 'register' | 'forcePasswordChange';

/**
 * Prüft auf FormGroup-Ebene, ob Passwort und Passwort-Bestätigung übereinstimmen.
 */
function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsMismatch: true };
}

function newPasswordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmNewPassword = group.get('confirmNewPassword')?.value;
  return newPassword === confirmNewPassword ? null : { passwordsMismatch: true };
}

const KUNDENNUMMER_VALIDATORS = [
  Validators.required,
  Validators.minLength(7),
  Validators.maxLength(7),
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  readonly mode = signal<AuthMode>('login');
  readonly submitError = signal<string | null>(null);
  readonly submitSuccess = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  // Zwischenspeicher für den gerade eingeloggten Mitarbeiter
  private pendingMitarbeiter: any = null;

  // Login identifiziert den Nutzer ausschließlich über die E-Mail-Adresse.
  // Ob es sich um einen Mitarbeiter oder Kunden handelt, entscheidet das Backend.
  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [true],
  });

  readonly registerForm: FormGroup = this.fb.group(
    {
      vorname: ['', [Validators.required, Validators.minLength(1)]],
      nachname: ['', [Validators.required, Validators.minLength(1)]],
      kundennummer: ['', KUNDENNUMMER_VALIDATORS],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          // mind. ein Klein-, ein Großbuchstabe und eine Ziffer
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator }
  );

  readonly forcePasswordForm: FormGroup = this.fb.group(
    {
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
        ],
      ],
      confirmNewPassword: ['', [Validators.required]],
    },
    { validators: newPasswordsMatchValidator }
  );

  switchMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.submitError.set(null);
    this.submitSuccess.set(null);
  }

  onLoginSubmit(): void {
    this.submitError.set(null);
    this.submitSuccess.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .login(this.loginForm.value)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response: any) => {
          console.log('Login-Antwort:', response);

          if (response && response.success === true) {
            // Prüfe, ob Mitarbeiter sein Passwort ändern muss
            if (response.status === 'mitarbeiter' && response.requiresPasswordChange === true) {
              this.pendingMitarbeiter = response.user;
              this.switchMode('forcePasswordChange');
              return;
            }

            this.authService.setLoginState(response.status, response.user);
            if (response.status === 'mitarbeiter') {
              this.submitSuccess.set('Erfolgreich als Mitarbeiter angemeldet!');
            } else {
              this.submitSuccess.set('Willkommen zurück!');
            }
          } else {
            this.submitError.set(response?.message || 'Kein Nutzer mit dieser E-Mail-Adresse gefunden.');
          }
        },
        error: (err: any) => {
          console.error('Netzwerkfehler beim Login:', err);
          this.submitError.set(
            'Verbindungsfehler. Bitte prüfe deine Daten oder die Serververbindung.'
          );
        },
      });
  }

  onForcePasswordSubmit(): void {
    this.submitError.set(null);
    this.submitSuccess.set(null);

    if (this.forcePasswordForm.invalid) {
      this.forcePasswordForm.markAllAsTouched();
      return;
    }

    const newPassword = this.forcePasswordForm.get('newPassword')?.value;

    this.isSubmitting.set(true);

    this.authService
      .changePassword({
        email: this.pendingMitarbeiter.email,
        newPassword: newPassword,
        userType: 'mitarbeiter'
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response: any) => {
          if (response && response.success === true) {
            // Nach erfolgreicher Änderung: normal einloggen
            this.authService.setLoginState('mitarbeiter', this.pendingMitarbeiter);
            this.submitSuccess.set('Passwort erfolgreich geändert. Willkommen!');
            this.switchMode('login');
            this.forcePasswordForm.reset();
            this.pendingMitarbeiter = null;
          } else {
            this.submitError.set(response?.message || 'Passwortänderung fehlgeschlagen.');
          }
        },
        error: (err: any) => {
          console.error('Fehler bei Passwortänderung:', err);
          this.submitError.set('Verbindungsfehler bei der Passwortänderung.');
        },
      });
  }

  onRegisterSubmit(): void {
    this.submitError.set(null);
    this.submitSuccess.set(null);

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { confirmPassword, ...kundenDaten } = this.registerForm.value;

    this.isSubmitting.set(true);

    this.authService
      .registerKunde(kundenDaten)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response: any) => {
          if (response && response.success === true) {
            console.log('Erfolgreich registriert:', response);

            const vorname = this.registerForm.get('vorname')?.value;

            this.registerForm.reset({
              vorname: '',
              nachname: '',
              email: '',
              kundennummer: '',
              password: '',
              confirmPassword: '',
            });

            this.switchMode('login');
            this.submitSuccess.set(
              `Willkommen, ${vorname}! Deine Registrierung war erfolgreich – du kannst dich jetzt anmelden.`
            );
          } else {
            console.warn('Datenbank- oder Logikfehler im Backend:', response);
            this.submitError.set(
              response.message || 'Registrierung fehlgeschlagen. Möglicherweise existiert dieser Nutzer bereits.'
            );
          }
        },
        error: (err) => {
          console.error('Netzwerkfehler bei der Registrierung:', err);
          this.submitError.set(
            'Verbindungsfehler. Bitte prüfe deine Daten oder die Serververbindung zu XAMPP.'
          );
        },
      });
  }
}