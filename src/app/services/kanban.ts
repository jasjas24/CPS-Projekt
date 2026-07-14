import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type KanbanStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type KanbanPriority = 'low' | 'medium' | 'high';

export interface Mitarbeiter {
  id: number;
  vorname: string;
  nachname: string;
  email: string;
  rolle_id: number;
}

export interface Projekt {
  id: number;
  name: string;
  beschreibung: string;
  status: string;
}

export interface KanbanTask {
  id: number;
  titel: string;
  beschreibung: string | null;
  status: KanbanStatus;
  prioritaet: KanbanPriority;
  projekt_id: number | null;
  projekt_name?: string | null;
  mitarbeiter_id: number | null;
  mitarbeiter_vorname?: string | null;
  mitarbeiter_nachname?: string | null;
  erstellt_von_mitarbeiter_id: number | null;
  faellig_am: string | null;
  sort_order: number;
  erstellt_am: string;
  aktualisiert_am: string;
}

@Injectable({
  providedIn: 'root'
})
export class KanbanService {
  private http = inject(HttpClient);
  private apiBase = 'http://localhost/cps-api';

  getTasks(): Observable<KanbanTask[]> {
    return this.http.get<KanbanTask[]>(`${this.apiBase}/get_kanban_tasks.php`);
  }

  getMitarbeiter(): Observable<Mitarbeiter[]> {
    return this.http.get<Mitarbeiter[]>(`${this.apiBase}/get_mitarbeiter.php`);
  }

  getProjekte(): Observable<Projekt[]> {
    return this.http.get<Projekt[]>(`${this.apiBase}/get_projekte.php`);
  }

  createTask(payload: Partial<KanbanTask>): Observable<{ success: boolean; id: number }> {
    return this.http.post<{ success: boolean; id: number }>(`${this.apiBase}/create_kanban_task.php`, payload);
  }

  updateTask(payload: Partial<KanbanTask>): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiBase}/update_kanban_task.php`, payload);
  }

  moveTask(payload: { taskId: number; status: KanbanStatus; orderedTaskIds: number[] }): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiBase}/move_kanban_task.php`, payload);
  }

  deleteTask(id: number): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiBase}/delete_kanban_task.php`, { id });
  }
}