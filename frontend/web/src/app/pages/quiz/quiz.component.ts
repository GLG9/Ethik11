import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

import {
  QuizMetadata,
  QuizQuestionDto,
  QuizResultDto,
  QuizReviewQuestion,
  QuizService,
  QuizSubmitStorage,
} from './quiz.service';

type QuizPhase = 'loading' | 'intro' | 'quiz' | 'confirm' | 'submitted' | 'error';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RouterLinkActive],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss',
})
export class QuizComponent implements OnInit, OnDestroy {
  private readonly quizService = inject(QuizService);
  private readonly fb = inject(FormBuilder);

  readonly nameForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
  });

  metadata: QuizMetadata | null = null;
  questions: QuizQuestionDto[] = [];

  phase: QuizPhase = 'loading';
  showNameModal = false;
  prefersReducedMotion = false;

  currentIndex = 0;
  selections: Record<string, string[]> = {};
  @ViewChild('questionCard') questionCard?: ElementRef<HTMLElement>;

  timerMs = 0;
  private timerStartedAt = 0;
  private timerInterval?: ReturnType<typeof setInterval>;
  private questionScrollTimer?: number;

  playerName = '';
  result: QuizResultDto | null = null;
  storageInfo: QuizSubmitStorage | null = null;
  leaderboardPreview: QuizResultDto[] = [];
  submittedReview: QuizReviewQuestion[] = [];
  submittedReviewIndex = 0;
  errorMessage = '';

  private mediaQuery?: MediaQueryList;
  private readonly isBrowser = typeof window !== 'undefined';

  philosopherStrip = [
    { name: 'Karl Marx', hue: 12 },
    { name: 'Plessner', hue: 18 },
    { name: 'Löwith', hue: 24 },
    { name: 'Gehlen', hue: 32 },
    { name: 'Kant', hue: 28 },
  ];

  ngOnInit(): void {
    this.initMotionPreference();
    this.loadQuestions();
    this.initPlayerName();
  }

  startQuizFlow(): void {
    if (!this.playerName) {
      this.openNameModal();
      return;
    }
    this.beginQuiz();
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.clearQuestionScrollTimer();
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.onMotionPreferenceChange);
    }
  }

  get currentQuestion(): QuizQuestionDto | undefined {
    return this.questions[this.currentIndex];
  }

  get totalQuestionCount(): number {
    if (this.questions.length) {
      return this.questions.length;
    }
    return this.metadata?.activeTotal ?? 0;
  }

  get progressLabel(): string {
    const total = this.totalQuestionCount;
    if (!total) {
      return '–';
    }
    const current = Math.min(this.currentIndex + 1, total);
    return `${current}/${total}`;
  }

  get hasSelection(): boolean {
    const question = this.currentQuestion;
    if (!question) {
      return false;
    }
    return (this.selections[question.id] ?? []).length > 0;
  }

  get progressPercent(): number {
    const total = this.totalQuestionCount;
    if (!total) {
      return 0;
    }
    const current = Math.min(this.currentIndex + 1, total);
    return Math.round((current / total) * 100);
  }

  get timerDisplay(): string {
    const totalSeconds = Math.floor(this.timerMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  get statusMessage(): string {
    if (!this.metadata) {
      return '';
    }
    if (this.metadata.upcomingTotal > 0) {
      return `${this.metadata.plannedTotal} geplant – ${this.metadata.upcomingTotal} in Arbeit`;
    }
    return `${this.metadata.activeTotal} Fragen live`;
  }

  get progressSteps(): number[] {
    const total = this.totalQuestionCount;
    return total > 0 ? Array.from({ length: total }, (_, idx) => idx) : [];
  }

  openNameModal(): void {
    this.showNameModal = true;
    const name = this.playerName || this.quizService.getStoredName() || '';
    this.nameForm.patchValue({ name });
  }

  saveName(): void {
    if (this.nameForm.invalid) {
      this.nameForm.markAllAsTouched();
      return;
    }
    this.playerName = this.nameForm.value.name?.trim() ?? '';
    this.quizService.setStoredName(this.playerName);
    this.showNameModal = false;
    if (this.phase === 'intro') {
      this.beginQuiz();
    }
  }

  dismissNameModal(): void {
    this.showNameModal = false;
  }

  selectOption(question: QuizQuestionDto, choiceId: string): void {
    if (!question) {
      return;
    }
    const existing = new Set(this.selections[question.id] ?? []);
    if (question.multi) {
      if (existing.has(choiceId)) {
        existing.delete(choiceId);
      } else {
        existing.add(choiceId);
      }
      this.selections[question.id] = Array.from(existing);
    } else {
      this.selections[question.id] = [choiceId];
    }
    this.errorMessage = '';
  }

  goNext(): void {
    if (!this.currentQuestion) {
      return;
    }
    this.errorMessage = '';
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex += 1;
      this.scheduleQuestionScroll();
      return;
    }
    this.phase = 'confirm';
  }

  goBack(): void {
    if (this.phase === 'confirm') {
      this.phase = 'quiz';
      this.errorMessage = '';
      this.scheduleQuestionScroll();
      return;
    }
    if (this.currentIndex === 0) {
      return;
    }
    this.currentIndex -= 1;
    this.errorMessage = '';
    this.scheduleQuestionScroll();
  }

  submitQuiz(): void {
    if (!this.playerName) {
      this.openNameModal();
      return;
    }
    const answers: Record<string, string[]> = {};
    for (const question of this.questions) {
      const selected = this.selections[question.id];
      if (!selected || !selected.length) {
        this.errorMessage = 'Bitte wähle mindestens eine Antwort.';
        this.phase = 'quiz';
        this.currentIndex = this.questions.findIndex((q) => !(this.selections[q.id]?.length));
        return;
      }
      answers[question.id] = selected;
    }
    this.stopTimer();
    const timeMs = this.timerMs;
    this.phase = 'loading';
    this.quizService
      .submit({
        name: this.playerName,
        timeMs,
        answers,
      })
      .subscribe({
        next: (response) => {
          this.result = response.result;
          this.storageInfo = response.storage ?? null;
          this.submittedReview = response.review ?? [];
          this.submittedReviewIndex = 0;
          this.metadata = response.metadata;
          this.leaderboardPreview = response.leaderboard;
          if (response.storage?.highlightId) {
            this.quizService.setLastResultId(response.storage.highlightId);
          }
          this.timerMs = response.result.timeMs;
          this.phase = 'submitted';
          this.clearQuestionScrollTimer();
        },
        error: () => {
          this.phase = 'confirm';
          this.errorMessage = 'Das hat leider nicht geklappt. Bitte versuch es erneut.';
          this.storageInfo = null;
          this.submittedReview = [];
          this.submittedReviewIndex = 0;
        },
      });
  }

  restartQuiz(): void {
    this.result = null;
    this.storageInfo = null;
    this.leaderboardPreview = [];
    this.submittedReview = [];
    this.submittedReviewIndex = 0;
    this.timerMs = 0;
    this.currentIndex = 0;
    this.selections = {};
    this.phase = 'quiz';
    this.errorMessage = '';
    this.startTimer();
    this.scheduleQuestionScroll();
  }

  formatScore(entry: QuizResultDto): string {
    return `${entry.correct}/${entry.total}`;
  }

  formatTime(entry: QuizResultDto): string {
    return this.formatTimeMs(entry.timeMs);
  }

  formatTimeMs(value: number): string {
    const totalSeconds = Math.floor(value / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  isSelected(question: QuizQuestionDto, choiceId: string): boolean {
    return (this.selections[question.id] ?? []).includes(choiceId);
  }

  get currentSubmittedQuestion(): QuizReviewQuestion | null {
    if (!this.submittedReview.length) {
      return null;
    }
    return this.submittedReview[this.submittedReviewIndex] ?? null;
  }

  nextSubmittedQuestion(): void {
    if (!this.submittedReview.length) {
      return;
    }
    if (this.submittedReviewIndex >= this.submittedReview.length - 1) {
      return;
    }
    this.submittedReviewIndex += 1;
  }

  prevSubmittedQuestion(): void {
    if (!this.submittedReview.length) {
      return;
    }
    if (this.submittedReviewIndex === 0) {
      return;
    }
    this.submittedReviewIndex -= 1;
  }

  loadQuestions(): void {
    this.phase = 'loading';
    this.errorMessage = '';
    this.quizService.getQuestions().subscribe({
      next: (response) => {
        this.metadata = response.metadata;
        this.questions = response.items;
        this.phase = 'intro';
      if (this.playerName) {
        this.beginQuiz();
      } else {
        this.showNameModal = true;
      }
      },
      error: () => {
        this.phase = 'error';
        this.errorMessage = 'Quizfragen konnten nicht geladen werden.';
      },
    });
  }

  private beginQuiz(): void {
    this.phase = 'quiz';
    this.currentIndex = 0;
    this.startTimer();
  }

  private initPlayerName(): void {
    const stored = this.quizService.getStoredName();
    if (stored) {
      this.playerName = stored;
    } else {
      this.showNameModal = true;
    }
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerStartedAt = Date.now();
    this.timerMs = 0;
    this.timerInterval = setInterval(() => {
      this.timerMs = Date.now() - this.timerStartedAt;
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
    if (this.timerStartedAt) {
      this.timerMs = Date.now() - this.timerStartedAt;
    }
  }

  private initMotionPreference(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = this.mediaQuery.matches;
    this.mediaQuery.addEventListener('change', this.onMotionPreferenceChange);
  }

  private readonly onMotionPreferenceChange = (event: MediaQueryListEvent) => {
    this.prefersReducedMotion = event.matches;
  };

  private scheduleQuestionScroll(): void {
    if (!this.shouldAutoScroll()) {
      return;
    }
    this.clearQuestionScrollTimer();
    this.questionScrollTimer = window.setTimeout(() => {
      this.questionScrollTimer = undefined;
      this.scrollQuestionIntoView();
    }, 120);
  }

  private clearQuestionScrollTimer(): void {
    if (this.questionScrollTimer) {
      window.clearTimeout(this.questionScrollTimer);
      this.questionScrollTimer = undefined;
    }
  }

  private scrollQuestionIntoView(): void {
    if (!this.shouldAutoScroll()) {
      return;
    }
    if (this.phase !== 'quiz') {
      return;
    }
    const target = this.questionCard?.nativeElement;
    if (!target) {
      return;
    }
    const behavior: ScrollBehavior = this.prefersReducedMotion ? 'auto' : 'smooth';
    const offset = this.getStickyHeaderOffset() + 200;
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    const top = Math.max(targetTop - offset - 12, 0);
    window.scrollTo({ top, behavior });
  }

  private shouldAutoScroll(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    if (this.prefersReducedMotion) {
      return false;
    }
    return window.matchMedia('(max-width: 768px)').matches;
  }

  private getStickyHeaderOffset(): number {
    if (!this.isBrowser) {
      return 0;
    }
    const rootStyle = window.getComputedStyle(document.documentElement);
    const cssVar = rootStyle.getPropertyValue('--header-height').trim();
    const parsed = cssVar ? parseFloat(cssVar.replace('px', '')) : NaN;
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
    const header = document.getElementById('site-header');
    if (header) {
      return header.getBoundingClientRect().height;
    }
    return 72;
  }
}
