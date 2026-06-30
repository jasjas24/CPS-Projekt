import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IntroStateService {
  readonly hasPlayedIntro = signal(false);

  markIntroAsPlayed(): void {
    this.hasPlayedIntro.set(true);
  }
}