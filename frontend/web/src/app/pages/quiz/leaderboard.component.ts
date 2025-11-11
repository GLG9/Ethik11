import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  LeaderboardResponse,
  QuizResultDto,
  QuizReviewQuestion,
  QuizReviewResponse,
  QuizService,
} from './quiz.service';

@Component({
  selector: 'app-quiz-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
})
export class LeaderboardComponent implements OnInit {
  private readonly quizService = inject(QuizService);

  metadata: LeaderboardResponse['metadata'] | null = null;
  entries: QuizResultDto[] = [];
  isLoading = true;
  errorMessage = '';
  highlightId = this.quizService.getLastResultId();
  reviewVisible = false;
  reviewLoading = false;
  reviewError = '';
  reviewData: QuizReviewResponse | null = null;
  reviewIndex = 0;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.quizService.leaderboard().subscribe({
      next: (response) => {
        this.metadata = response.metadata;
        this.entries = response.entries;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Leaderboard konnte nicht geladen werden.';
        this.isLoading = false;
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

  openReview(entry: QuizResultDto): void {
    this.reviewVisible = true;
    this.reviewLoading = true;
    this.reviewError = '';
    this.reviewData = null;
    this.reviewIndex = 0;

    this.quizService.getReview(entry.id).subscribe({
      next: (data) => {
        this.reviewData = data;
        this.reviewLoading = false;
      },
      error: () => {
        this.reviewError = 'Auswertung konnte nicht geladen werden.';
        this.reviewLoading = false;
      },
    });
  }

  closeReview(): void {
    this.reviewVisible = false;
    this.reviewLoading = false;
    this.reviewError = '';
    this.reviewData = null;
    this.reviewIndex = 0;
  }

  get reviewQuestion(): QuizReviewQuestion | null {
    if (!this.reviewData) {
      return null;
    }
    return this.reviewData.questions[this.reviewIndex] ?? null;
  }

  get isLastReviewQuestion(): boolean {
    if (!this.reviewData) {
      return true;
    }
    return this.reviewIndex >= this.reviewData.questions.length - 1;
  }

  nextReviewQuestion(): void {
    if (!this.reviewData) {
      return;
    }
    if (this.isLastReviewQuestion) {
      this.closeReview();
      return;
    }
    this.reviewIndex = Math.min(this.reviewIndex + 1, this.reviewData.questions.length - 1);
  }

  prevReviewQuestion(): void {
    if (!this.reviewData) {
      return;
    }
    const prevIndex = Math.max(this.reviewIndex - 1, 0);
    this.reviewIndex = prevIndex;
  }
}
