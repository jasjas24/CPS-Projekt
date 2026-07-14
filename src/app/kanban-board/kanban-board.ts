import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Sortable, { SortableEvent } from 'sortablejs';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './kanban-board.html',
  styleUrl: './kanban-board.scss',
  host: { ngSkipHydration: 'true' }
})
export class KanbanBoardComponent implements OnInit, AfterViewInit, OnDestroy {
  private kanbanService = inject(KanbanService);

  @ViewChildren('sortableColumn')
  sortableColumns!: QueryList<ElementRef<HTMLDivElement>>;

  private sortableInstances: Sortable[] = [];
  private viewInitialized = false;

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

  ngAfterViewInit(): void {
    this.viewInitialized = true;

    this.sortableColumns.changes.subscribe(() => {
      queueMicrotask(() => this.setupSortables());
    });

    queueMicrotask(() => this.setupSortables());
  }

  ngOnDestroy(): void {
    this.destroySortables();
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
                queueMicrotask(() => this.setupSortables());
              },
              error: () => {
                this.isLoading.set(false);
              }
            });
          },
          error: () => {
            this.isLoading.set(false);
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getTaskList(status: KanbanStatus): KanbanTask[] {
    return this.groupedTasks()[status];
  }

  private setupSortables(): void {
    if (!this.viewInitialized || this.isLoading() || !this.sortableColumns?.length) {
      return;
    }

    this.destroySortables();

    this.sortableColumns.forEach((columnRef) => {
      const columnElement = columnRef.nativeElement;

      const instance = Sortable.create(columnElement, {
        group: 'kanban-board',
        animation: 180,
        draggable: '.task-card',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        swapThreshold: 0.65,
        onStart: () => {
          columnElement.classList.add('sortable-drag-over');
        },
        onEnd: (event: SortableEvent) => {
          this.sortableColumns.forEach(ref => {
            ref.nativeElement.classList.remove('sortable-drag-over');
          });

          const taskId = Number((event.item as HTMLElement).dataset['taskId']);
          const targetColumn = event.to as HTMLElement;
          const targetStatus = targetColumn.dataset['status'] as KanbanStatus;

          const orderedTaskIds = Array.from(targetColumn.querySelectorAll('.task-card'))
            .map((el) => Number((el as HTMLElement).dataset['taskId']))
            .filter((id) => !Number.isNaN(id));

          if (!taskId || !targetStatus || orderedTaskIds.length === 0) {
            this.loadAll();
            return;
          }

          this.kanbanService.moveTask({
            taskId,
            status: targetStatus,
            orderedTaskIds
          }).subscribe({
            next: () => this.loadAll(),
            error: () => this.loadAll()
          });
        }
      });

      this.sortableInstances.push(instance);
    });
  }

  private destroySortables(): void {
    this.sortableInstances.forEach(instance => instance.destroy());
    this.sortableInstances = [];
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
      },
      error: () => this.loadAll()
    });
  }

  updateAssignee(task: KanbanTask, mitarbeiterId: string | number | null): void {
    const id = mitarbeiterId !== null && mitarbeiterId !== '' ? Number(mitarbeiterId) : null;

    this.kanbanService.updateTask({
      ...task,
      mitarbeiter_id: id
    }).subscribe({
      next: () => this.loadAll(),
      error: () => this.loadAll()
    });
  }

  updatePriority(task: KanbanTask, prioritaet: KanbanPriority): void {
    this.kanbanService.updateTask({
      ...task,
      prioritaet
    }).subscribe({
      next: () => this.loadAll(),
      error: () => this.loadAll()
    });
  }

  deleteTask(taskId: number): void {
    this.kanbanService.deleteTask(taskId).subscribe({
      next: () => this.loadAll(),
      error: () => this.loadAll()
    });
  }

  fullName(mitarbeiterId: number | null): string {
    if (mitarbeiterId === null) {
      return 'Nicht zugewiesen';
    }

    const user = this.mitarbeiter().find(m => m.id === mitarbeiterId);
    return user ? `${user.vorname} ${user.nachname}` : 'Nicht zugewiesen';
  }
}