import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './login/login';

export const routes: Routes = [
    { path: '', component: Home, title: 'MOVE:botics' },
    { path: 'login', component: Login, title: 'Intranet' }
];
