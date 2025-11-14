import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  HERO_ARTICLE_ID,
  HERO_TEASER_IDS,
  MEISTGELESEN,
  NEWS_ARTICLES,
  NewsArticle,
  TICKER_HEADLINES,
  getArticleById,
} from './news.data';

interface MeistgelesenDisplay {
  articleId: string;
  label: string;
  article: NewsArticle;
}

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss',
})
export class NewsComponent {
  readonly pageTitle = 'News & Aktuelles';
  readonly pageSubtitle = 'Philosophische Menschenbilder in den Nachrichten';
  readonly tickerHeadlines = TICKER_HEADLINES;

  readonly heroArticle = getArticleById(HERO_ARTICLE_ID);
  readonly heroTeasers = HERO_TEASER_IDS.map((id) => getArticleById(id)).filter(
    (article): article is NewsArticle => Boolean(article)
  );

  private readonly excludedIds = new Set([HERO_ARTICLE_ID, ...HERO_TEASER_IDS]);

  readonly articles = NEWS_ARTICLES.filter((article) => !this.excludedIds.has(article.id));

  readonly meistgelesen: MeistgelesenDisplay[] = MEISTGELESEN.reduce<MeistgelesenDisplay[]>(
    (entries, entry) => {
      const article = getArticleById(entry.articleId);
      if (article) {
        entries.push({ ...entry, article });
      }
      return entries;
    },
    []
  );
}
