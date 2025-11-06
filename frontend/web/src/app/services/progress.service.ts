import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ProgressState = Record<string, boolean>;

const STORAGE_KEY = 'ki-progress-state';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly progressSubject = new BehaviorSubject<ProgressState>(this.loadInitial());

  readonly progress$ = this.progressSubject.asObservable();

  markVisited(modelId: string): void {
    const current = this.progressSubject.value;
    if (current[modelId]) {
      return;
    }
    const updated = { ...current, [modelId]: true };
    this.progressSubject.next(updated);
    this.persist(updated);
  }

  isVisited(modelId: string): boolean {
    return Boolean(this.progressSubject.value[modelId]);
  }

  reset(): void {
    this.progressSubject.next({});
    this.persist({});
  }

  private loadInitial(): ProgressState {
    if (typeof window === 'undefined') {
      return {};
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as ProgressState;
      }
    } catch (error) {
      console.warn('Konnte Fortschritt nicht laden:', error);
    }
    return {};
  }

  private persist(state: ProgressState): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Konnte Fortschritt nicht speichern:', error);
    }
  }
}
