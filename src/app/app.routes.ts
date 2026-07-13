import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './login/login';
import { Profil } from './profil/profil';
import { Kanban } from './kanban/kanban';
import { Dashboard } from './dashboard/dashboard';

export const routes: Routes = [
    { path: '', component: Home, title: 'MOVE:botics' },
    { path: 'login', component: Login, title: 'Intranet' },
    { path: 'profil', component: Profil, title: 'Profil' },
    { path: 'kanban', component: Profil, title: 'Kanban' },
    { path: 'dashboard', component: Profil, title: 'Dashboard' }
];