import { Routes } from '@angular/router';

import { Focus } from './focus/focus';
import { History } from './history/history';

export const routes: Routes = [
  {
    path: '',
    component: Focus
  },
  {
    path: 'history',
    component: History
  }
];
