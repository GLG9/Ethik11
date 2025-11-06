import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoewithComponent } from './pages/loewith/loewith.component';
import { GehlenComponent } from './pages/gehlen/gehlen.component';
import { KantComponent } from './pages/kant/kant.component';
import { PlessnerComponent } from './pages/plessner/plessner.component';
import { MarxComponent } from './pages/marx/marx.component';
import { QuizComponent } from './pages/quiz/quiz.component';
import { AdminComponent } from './pages/admin/admin.component';
import { LeaderboardComponent } from './pages/quiz/leaderboard.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'loewith',
    component: LoewithComponent,
  },
  {
    path: 'gehlen',
    component: GehlenComponent,
  },
  {
    path: 'kant',
    component: KantComponent,
  },
  {
    path: 'plessner',
    component: PlessnerComponent,
  },
  {
    path: 'marx',
    component: MarxComponent,
  },
  {
    path: 'quiz',
    component: QuizComponent,
  },
  {
    path: 'quiz/leaderboard',
    component: LeaderboardComponent,
  },
  {
    path: 'admin',
    component: AdminComponent,
  },
];
