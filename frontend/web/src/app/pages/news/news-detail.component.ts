import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { NewsArticle, TICKER_HEADLINES, getArticleById, getRelatedArticles } from './news.data';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './news-detail.component.html',
  styleUrl: './news-detail.component.scss',
})
export class NewsDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly isBrowser = typeof window !== 'undefined';

  readonly tickerHeadlines = TICKER_HEADLINES;

  article: NewsArticle | null = null;
  relatedArticles: NewsArticle[] = [];
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((params) => this.loadArticle(params));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get hasArticle(): boolean {
    return Boolean(this.article);
  }

  private loadArticle(params: ParamMap): void {
    const id = params.get('id');
    if (!id) {
      this.article = null;
      this.relatedArticles = [];
      return;
    }
    const article = getArticleById(id);
    this.article = article ?? null;
    this.relatedArticles = article ? getRelatedArticles(article.id, 3) : [];
    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }
}
