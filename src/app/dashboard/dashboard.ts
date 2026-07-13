import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';

interface DashboardData {
  mode: string;
  task: string;
  navigation: string;
  battery: number;
  voltage: number;
  speed: number;
  steering: number;
  latency: number;
  frontDistance: number;
  frontLeftDistance: number;
  frontRightDistance: number;
  leftDistance: number;
  rightDistance: number;
  rearDistance: number;
  message: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly maxSystemActivities = 8;

  readonly lastUpdate = signal('--:--:--');
  readonly connectionText = signal('ONLINE');
  readonly systemLogs = signal<{ time: string; message: string }[]>([]);

  readonly dashboardData = signal<DashboardData>({
    mode: 'MANUELL & AUTONOM',
    task: 'UMGEBUNG SCANNEN',
    navigation: 'BEREIT',
    battery: 82,
    voltage: 7.8,
    speed: 18,
    steering: -12,
    latency: 18,
    frontDistance: 46,
    frontLeftDistance: 42,
    frontRightDistance: 49,
    leftDistance: 54,
    rightDistance: 52,
    rearDistance: 68,
    message: 'Hinderniserkennung aktiv. Umgebung wird überwacht.'
  });

  private readonly messages = [
    'Hinderniserkennung aktiv. Umgebung wird überwacht.',
    'LIDAR Sensor liefert stabile Distanzdaten.',
    'Autonome Navigation bereit für Fahrbefehl.',
    'Kamerasystem analysiert den aktuellen Bereich.',
    'Fahrzeugstatus stabil. Keine kritischen Fehler erkannt.',
    'Sensordaten erfolgreich mit Dashboard synchronisiert.'
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit(): void {
    this.updateDashboard();

    if (isPlatformBrowser(this.platformId)) {
      this.intervalId = setInterval(() => {
        this.updateDashboard();
      }, 2500);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  get batteryBarWidth(): string {
    return `${this.dashboardData().battery}%`;
  }

  private getTime(): string {
    return new Date().toLocaleTimeString('de-DE');
  }

  private addLog(message: string): void {
    const newEntry = {
      time: this.getTime(),
      message
    };

    this.systemLogs.update((logs) => [newEntry, ...logs].slice(0, this.maxSystemActivities));
  }

  private simulateData(): void {
    const current = this.dashboardData();

    const nextData: DashboardData = {
      ...current,
      battery: Math.max(15, current.battery - Math.random() * 0.08),
      voltage: 7.2 + Math.random() * 0.8,
      speed: Math.floor(8 + Math.random() * 22),
      steering: Math.floor(-25 + Math.random() * 50),
      latency: Math.floor(12 + Math.random() * 18),
      frontDistance: Math.floor(25 + Math.random() * 110),
      frontLeftDistance: Math.floor(20 + Math.random() * 100),
      frontRightDistance: Math.floor(20 + Math.random() * 100),
      leftDistance: Math.floor(15 + Math.random() * 70),
      rightDistance: Math.floor(15 + Math.random() * 70),
      rearDistance: Math.floor(20 + Math.random() * 100),
      message: this.messages[Math.floor(Math.random() * this.messages.length)]
    };

    const nearestFrontObstacle = Math.min(
      nextData.frontDistance,
      nextData.frontLeftDistance,
      nextData.frontRightDistance
    );

    if (nearestFrontObstacle < 40) {
      nextData.task = 'GESCHWINDIGKEIT REDUZIEREN';
      nextData.navigation = 'HINDERNIS ERKANNT';
    } else {
      nextData.task = 'UMGEBUNG SCANNEN';
      nextData.navigation = 'BEREIT';
    }

    this.dashboardData.set(nextData);
  }

  private updateDashboard(): void {
    this.simulateData();
    this.connectionText.set('ONLINE');
    this.lastUpdate.set(this.getTime());
    this.addLog(this.dashboardData().message);
  }
}