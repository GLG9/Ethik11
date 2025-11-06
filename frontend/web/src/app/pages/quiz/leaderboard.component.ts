import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  LeaderboardResponse,
  QuizResultDto,
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
}
