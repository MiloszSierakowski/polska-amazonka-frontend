import { Routes } from '@angular/router';

import { LayoutComponent } from './core/layout/layout.component';

import { HomeComponent } from './features/public/pages/home/home.component';

import { adminAuthGuard } from './core/guards/admin-auth.guard';



export const routes: Routes = [

  {

    path: '',

    component: LayoutComponent,

    children: [

      {

        path: '',

        component: HomeComponent

      }

    ]

  },

  {

    path: 'admin/login',

    loadComponent: () =>

      import('./features/admin/login/login.component').then((m) => m.LoginComponent)

  },

  {

    path: 'admin/panel',

    canActivate: [adminAuthGuard],

    loadComponent: () =>

      import('./features/admin/panel/admin-panel.component').then((m) => m.AdminPanelComponent)

  },

  {

    path: 'admin/users',

    redirectTo: 'admin/panel'

  }

];

