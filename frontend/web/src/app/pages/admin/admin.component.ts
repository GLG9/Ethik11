import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { QuizResultDto, QuizService } from '../quiz/quiz.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private readonly quizService = inject(QuizService);
  private readonly fb = inject(FormBuilder);
  private readonly storageKey = 'ethikAdminUnlocked';
  private readonly adminPassword = 'adminglg';

  readonly passwordForm = this.fb.group({
    password: ['', [Validators.required]],
  });

  entries: QuizResultDto[] = [];
  isLoading = true;
  errorMessage = '';
  clearing = false;
  isUnlocked = false;
  authError = '';
  removingId: string | null = null;

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.localStorage.getItem(this.storageKey) === '1') {
      this.isUnlocked = true;
      this.load();
    } else {
      this.isLoading = false;
    }
  }

  unlock(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const value = this.passwordForm.value.password ?? '';
    if (value !== this.adminPassword) {
      this.authError = 'Passwort ist falsch.';
      return;
    }
    this.authError = '';
    this.isUnlocked = true;
    this.passwordForm.reset();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(this.storageKey, '1');
    }
    this.load();
  }

  logout(): void {
    this.isUnlocked = false;
    this.entries = [];
    this.errorMessage = '';
    this.isLoading = false;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(this.storageKey);
    }
  }

  load(): void {
    if (!this.isUnlocked) {
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.quizService.leaderboard().subscribe({
      next: (response) => {
        this.entries = response.entries;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Daten konnten nicht geladen werden.';
        this.isLoading = false;
      },
    });
  }

  clearLeaderboard(): void {
    if (this.clearing) {
      return;
    }
    const confirmation = window.confirm(
      'Leaderboard wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
    );
    if (!confirmation) {
      return;
    }
    this.clearing = true;
    this.quizService.clearLeaderboard().subscribe({
      next: () => {
        this.clearing = false;
        this.load();
      },
      error: () => {
        this.clearing = false;
        this.errorMessage = 'Löschen fehlgeschlagen.';
      },
    });
  }

  formatScore(entry: QuizResultDto): string {
    return `${entry.correct}/${entry.total}`;
  }

  formatTime(entry: QuizResultDto): string {
    const totalSeconds = Math.floor(entry.timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  trackByResult(index: number, entry: QuizResultDto): string {
    return entry.id ?? `entry-${index}`;
  }

  removeEntry(entry: QuizResultDto): void {
    if (!entry.id) {
      return;
    }
    if (this.removingId) {
      return;
    }
    const confirmation = window.confirm(`Eintrag von "${entry.name}" wirklich löschen?`);
    if (!confirmation) {
      return;
    }
    this.removingId = entry.id;
    this.quizService.deleteEntry(entry.id).subscribe({
      next: () => {
        this.removingId = null;
        this.entries = this.entries.filter((item) => item.id !== entry.id);
      },
      error: () => {
        this.removingId = null;
        this.errorMessage = 'Eintrag konnte nicht gelöscht werden.';
      },
    });
  }
}
