import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import {
  KanbanPriority,
  KanbanService,
  KanbanStatus,
  KanbanTask,
  Mitarbeiter,
  Projekt
} from '../services/kanban';

type ColumnDef = {
  key: KanbanStatus;
  label: string;
};

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './kanban-board.html',
  styleUrl: './kanban-board.scss',
  host: { ngSkipHydration: 'true' }
})
export class KanbanBoardComponent implements OnInit {
  private kanbanService = inject(KanbanService);

  readonly columns: ColumnDef[] = [
    { key: 'todo', label: 'ToDo' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'review', label: 'Review' },
    { key: 'done', label: 'Done' }
  ];

  readonly tasks = signal<KanbanTask[]>([]);
  readonly mitarbeiter = signal<Mitarbeiter[]>([]);
  readonly projekte = signal<Projekt[]>([]);
  readonly isLoading = signal(true);

  readonly draft = signal<Partial<KanbanTask>>({
    titel: '',
    beschreibung: '',
    status: 'todo',
    prioritaet: 'medium',
    projekt_id: null,
    mitarbeiter_id: null,
    faellig_am: null
  });

  readonly groupedTasks = computed(() => {
    const all = this.tasks();
    return {
      todo: all.filter(task => task.status === 'todo').sort((a, b) => a.sort_order - b.sort_order),
      in_progress: all.filter(task => task.status === 'in_progress').sort((a, b) => a.sort_order - b.sort_order),
      review: all.filter(task => task.status === 'review').sort((a, b) => a.sort_order - b.sort_order),
      done: all.filter(task => task.status === 'done').sort((a, b) => a.sort_order - b.sort_order)
    };
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading.set(true);

    this.kanbanService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);

        this.kanbanService.getMitarbeiter().subscribe({
          next: (mitarbeiter) => {
            this.mitarbeiter.set(mitarbeiter);

            this.kanbanService.getProjekte().subscribe({
              next: (projekte) => {
                this.projekte.set(projekte);
                this.isLoading.set(false);
              },
              error: () => this.isLoading.set(false)
            });
          },
          error: () => this.isLoading.set(false)
        });
      },
      error: () => this.isLoading.set(false)
    });
  }

  getTaskList(status: KanbanStatus): KanbanTask[] {
    return this.groupedTasks()[status];
  }

  drop(event: CdkDragDrop<KanbanTask[]>, targetStatus: KanbanStatus): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      event.container.data[event.currentIndex].status = targetStatus;
    }

    const updatedTasks = [...this.tasks()];
    const affectedIds = event.container.data.map(task => task.id);
    this.tasks.set(updatedTasks);

    const movedTask = event.container.data[event.currentIndex];

    event.container.data.forEach((task, index) => {
      task.sort_order = index + 1;
    });

    this.kanbanService.moveTask({
      taskId: movedTask.id,
      status: targetStatus,
      orderedTaskIds: affectedIds
    }).subscribe({
      next: () => this.loadAll(),
      error: () => this.loadAll()
    });
  }

  createTask(): void {
    const payload = this.draft();

    if (!payload.titel || !payload.titel.trim()) {
      return;
    }

    this.kanbanService.createTask(payload).subscribe({
      next: () => {
        this.draft.set({
          titel: '',
          beschreibung: '',
          status: 'todo',
          prioritaet: 'medium',
          projekt_id: null,
          mitarbeiter_id: null,
          faellig_am: null
        });
        this.loadAll();
      }
    });
  }

  updateAssignee(task: KanbanTask, mitarbeiterId: string): void {
    const id = mitarbeiterId ? Number(mitarbeiterId) : null;

    this.kanbanService.updateTask({
      ...task,
      mitarbeiter_id: id
    }).subscribe({
      next: () => this.loadAll()
    });
  }

  updatePriority(task: KanbanTask, prioritaet: KanbanPriority): void {
    this.kanbanService.updateTask({
      ...task,
      prioritaet
    }).subscribe({
      next: () => this.loadAll()
    });
  }

  deleteTask(taskId: number): void {
    this.kanbanService.deleteTask(taskId).subscribe({
      next: () => this.loadAll()
    });
  }

  fullName(mitarbeiterId: number | null): string {
    if (mitarbeiterId === null) return 'Nicht zugewiesen';
    const user = this.mitarbeiter().find(m => m.id === mitarbeiterId);
    return user ? `${user.vorname} ${user.nachname}` : 'Nicht zugewiesen';
  }
}