import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface QuizChoiceDto {
  id: string;
  text: string;
}

export interface QuizQuestionDto {
  id: string;
  topic: string;
  prompt: string;
  multi: boolean;
  choices: QuizChoiceDto[];
}

export interface QuizMetadata {
  plannedTotal: number;
  activeTotal: number;
  upcomingTotal: number;
  placeholders: { id: string; label: string; status: string }[];
}

export interface QuizQuestionsResponse {
  metadata: QuizMetadata;
  items: QuizQuestionDto[];
  message?: string;
}

export interface QuizSubmitPayload {
  name: string;
  timeMs: number;
  answers: Record<string, string[]>;
}

export interface QuizResultDto {
  id: string;
  name: string;
  correct: number;
  total: number;
  timeMs: number;
  rank: number;
  createdAt: string;
}

export interface QuizReviewChoice {
  id: string;
  text: string;
  selected: boolean;
  correct: boolean;
}

export interface QuizReviewQuestion {
  id: string;
  topic: string;
  prompt: string;
  multi: boolean;
  choices: QuizReviewChoice[];
}

export interface QuizReviewResponse {
  result: QuizResultDto;
  questions: QuizReviewQuestion[];
}

export interface QuizSubmitResponse {
  metadata: QuizMetadata;
  result: QuizResultDto;
  leaderboard: QuizResultDto[];
}

export interface LeaderboardResponse {
  metadata: QuizMetadata;
  entries: QuizResultDto[];
}

@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/quiz';
  private readonly storageNameKey = 'ethikQuizName';
  private readonly storageResultKey = 'ethikQuizLastResultId';

  getQuestions(): Observable<QuizQuestionsResponse> {
    return this.http.get<QuizQuestionsResponse>(`${this.baseUrl}/questions/`);
  }

  submit(payload: QuizSubmitPayload): Observable<QuizSubmitResponse> {
    return this.http.post<QuizSubmitResponse>(`${this.baseUrl}/submit/`, payload);
  }

  leaderboard(limit?: number): Observable<LeaderboardResponse> {
    const options = limit
      ? { params: { limit: String(limit) } }
      : {};
    return this.http.get<LeaderboardResponse>(`${this.baseUrl}/leaderboard/`, options);
  }

  clearLeaderboard(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/leaderboard/`);
  }

  getReview(id: string): Observable<QuizReviewResponse> {
    return this.http.get<QuizReviewResponse>(`${this.baseUrl}/leaderboard/${id}/`);
  }

  deleteEntry(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/leaderboard/${id}/`);
  }

  getStoredName(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage.getItem(this.storageNameKey);
  }

  setStoredName(value: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(this.storageNameKey, value);
  }

  getLastResultId(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage.getItem(this.storageResultKey);
  }

  setLastResultId(value: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(this.storageResultKey, value);
  }
}
