import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profil.html',
  styleUrl: './profil.scss',
})
export class Profil {
  protected readonly authService = inject(AuthService);
}