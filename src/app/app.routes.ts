import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './login/login';
import { Profil } from './profil/profil';
import { KanbanBoardComponent } from './kanban-board/kanban-board';
import { Dashboard } from './dashboard/dashboard';

export const routes: Routes = [
    { path: '', component: Home, title: 'MOVE:botics' },
    { path: 'login', component: Login, title: 'Intranet' },
    { path: 'profil', component: Profil, title: 'Profil' },
    { path: 'kanban', component: KanbanBoardComponent, title: 'Kanban' },
    { path: 'dashboard', component: Dashboard, title: 'Dashboard' }
];