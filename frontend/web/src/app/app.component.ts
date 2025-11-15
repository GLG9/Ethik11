import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren,
  OnInit
} from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProgressService, ProgressState } from './services/progress.service';

declare global {
  interface Window {
    gsap?: any;
    ScrollTrigger?: any;
  }
}

interface Philosopher {
  id: string;
  name: string;
  life: string;
  epoch?: string;
  summary: string;
  keyline: string;
  portrait: {
    thumb: string;
    alt: string;
    caption: string;
    className?: string;
  };
  ideas: string[];
  quote?: string;
  quoteSource?: string;
}

interface CompareRow {
  label: string;
  values: Record<string, string>;
}

const focusableSelectors = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  philosophers: Philosopher[] = [
    {
      id: 'plessner',
      name: 'Helmuth Plessner',
      life: '1892-1985',
      epoch: 'Philosophische Anthropologie, 20. Jahrhundert',
      summary:
        'Plessner beschreibt den Menschen als exzentrisches Grenzwesen, das sich selbst nur über die Spiegelung in Welt und Gesellschaft versteht.',
      keyline: 'Exzentrische Positionalität als Balanceakt zwischen Leib, Körper und Kultur.',
      portrait: {
        thumb:
          'https://tu-dresden.de/gsw/phil/iso/hpr/ressourcen/bilder/helmuth-plessner/@@images/9ac5ef1c-3193-4a9b-98c9-574557223b92.jpeg',
        alt: 'Historisches Porträtfoto von Helmuth Plessner.',
        caption: 'Helmuth Plessner · Foto: TU Dresden',
        className: 'portrait-real'
      },
      ideas: [
        'Menschen als Grenzwesen zwischen Natur und Kultur mit exzentrischer Positionalität.',
        'Rollenkonzepte als elastische Hülle, um soziale Erwartungen zu modulieren.',
        'Institutionen und Technik erweitern die leibliche Perspektive auf Weltbezug.',
        'Anthropologische Selbstreflexion als Methode gegen eindimensionale Selbstbilder.'
      ],
      quote: 'Der Mensch ist sein eigener Außenpunkt.',
      quoteSource: 'Plessner, Die Stufen des Organischen und der Mensch (1928)'
    },
    {
      id: 'marx',
      name: 'Karl Marx',
      life: '1818-1883',
      epoch: 'Kritische Theorie, Industrialisierung',
      summary:
        'Karl Marx analysiert den Menschen als produktives Gattungswesen, das sich durch gesellschaftliche Arbeit entfaltet und entfremdet werden kann.',
      keyline: 'Emanzipation entsteht in der Veränderung materieller Verhältnisse.',
      portrait: {
        thumb: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Karl_Marx.jpg',
        alt: 'Porträtfotografie von Karl Marx.',
        caption: 'Karl Marx · Wikimedia Commons',
        className: 'portrait-real'
      },
      ideas: [
        'Historischer Materialismus: Bewusstsein folgt den Lebensverhältnissen.',
        'Arbeit als schöpferische Tätigkeit, die im Kapitalismus entfremdet wird.',
        'Kritik der politischen Ökonomie als Analyse von Macht- und Eigentumsstrukturen.',
        'Praxis und Revolution als kollektiver Prozess zur Aufhebung von Entfremdung.'
      ],
      quote:
        'Die Philosophen haben die Welt nur verschieden interpretiert; es kommt drauf an, sie zu verändern.',
      quoteSource: 'Karl Marx, Thesen über Feuerbach (1845)'
    },
    {
      id: 'kant',
      name: 'Immanuel Kant',
      life: '1724-1804',
      epoch: 'Aufklärung',
      summary:
        'Kant bestimmt den Menschen als vernunftbegabtes, autonomes Subjekt, das sich durch Selbstgesetzgebung moralisch verpflichtet.',
      keyline: 'Würde entsteht aus Autonomie und dem Vermögen, Zwecke zu setzen.',
      portrait: {
        thumb:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Immanuel_Kant_%281724-1804%29_engraving.jpg/640px-Immanuel_Kant_%281724-1804%29_engraving.jpg',
        alt: 'Kupferstich von Immanuel Kant aus dem 18. Jahrhundert.',
        caption: 'Immanuel Kant · historischer Kupferstich',
        className: 'portrait-real portrait-zoom portrait-zoom-strip'
      },
      ideas: [
        'Kategorischer Imperativ als Prüfstein moralischer Handlungen.',
        'Mündigkeit durch Gebrauch der eigenen Vernunft ohne Leitung eines anderen.',
        'Menschenwürde als Zweck an sich, niemals bloß als Mittel.',
        'Kosmopolitische Perspektive: Recht und Frieden als Aufgabe der Vernunft.'
      ],
      quote: 'Sapere aude! Habe Mut, dich deines eigenen Verstandes zu bedienen.',
      quoteSource: 'Kant, Was ist Aufklärung? (1784)'
    },
    {
      id: 'gehlen',
      name: 'Arnold Gehlen',
      life: '1904-1976',
      epoch: 'Philosophische Anthropologie, 20. Jahrhundert',
      summary:
        'Gehlen beschreibt den Menschen als Mängelwesen, das auf kulturelle Entlastung und stabile Institutionen angewiesen ist.',
      keyline: 'Institutionen sichern Handlungsspielräume und entlasten von Reizüberflutung.',
      portrait: {
        thumb:
          'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEivj8RxkrAgbUlrDu09iZ_RFRdXBVUIa__U5tKw5vn8QJ8aqfujy_Yo8qZrKXxID2rvISU3gSQw-G0nmdbyo454NgZqXnnV-V1GFSecnG3VFl57p-nbXa1uAo2QWEjZfjG2agGCegRUl9g/s200/Arnold+Gehlen+und+die+Kultur+-+Portrait+Gehlen.jpg',
        alt: 'Fotografie von Arnold Gehlen.',
        caption: 'Arnold Gehlen · Fotoquelle: diepaideia.blogspot.com',
        className: 'portrait-real'
      },
      ideas: [
        'Mängelwesen-These: biologische Unbestimmtheit verlangt kulturelle Ergänzung.',
        'Handlungsentlastung durch Institutionen, Rituale und Technik.',
        'Pragmatismus der Praxis: Stabilität geht vor utopischer Umwälzung.',
        'Anthropologie als Realanalyse der Handlungssysteme moderner Gesellschaften.'
      ],
      quote: 'Institutionen entlasten unsere Spontaneität.',
      quoteSource: 'Gehlen, Der Mensch (1940)'
    },
    {
      id: 'loewith',
      name: 'Karl Löwith',
      life: '1897-1973',
      epoch: 'Philosophiegeschichte, 20. Jahrhundert',
      summary:
        'Löwith vergleicht religiöse und säkulare Geschichtsdeutungen und zeigt, wie moderne Sinnentwürfe theologische Muster übernehmen.',
      keyline: 'Geschichtsdenken schwankt zwischen Heilserwartung und nüchterner Weltbeobachtung.',
      portrait: {
        thumb: 'https://jochenteuffel.com/wp-content/uploads/2023/11/karl-loewith2.jpg',
        alt: 'Porträtfoto von Karl Löwith.',
        caption: 'Karl Löwith · Foto: jochenteuffel.com',
        className: 'portrait-real'
      },
      ideas: [
        'Analyse der Geschichtsphilosophie als säkularisierte Eschatologie.',
        'Menschenbild als Spannung zwischen Glauben, Skepsis und Weltbürgertum.',
        'Kritik an Fortschrittsglauben ohne begründete Hoffnung.',
        'Historische Reflexion als Mittel, ideologische Selbstgewissheiten aufzubrechen.'
      ],
      quote: 'Die moderne Geschichtsphilosophie lebt vom theologischen Erbe, das sie verleugnet.',
      quoteSource: 'Löwith, Weltgeschichte und Heilsgeschehen (1949)'
    }
  ];

  compareRows: CompareRow[] = [
    {
      label: 'Menschenbild',
      values: {
        plessner: 'Grenzwesen mit exzentrischer Positionalität und Doppelperspektive auf sich selbst.',
        marx: 'Produktives Gattungswesen, das sich in Arbeit und Kooperation verwirklicht.',
        kant: 'Autonomes Vernunftwesen mit unveräußerlicher Würde.',
        gehlen: 'Mängelwesen, das Ausgleich durch Kultur und Institutionen braucht.',
        loewith: 'Historisches Wesen zwischen Transzendenz und säkularer Selbstdeutung.'
      }
    },
    {
      label: 'Natur/Kultur',
      values: {
        plessner: 'Verflochten; Kultur erweitert natürliche Grenzen des Leibes.',
        marx: 'Natur wird durch Arbeit verformt und gesellschaftlich angeeignet.',
        kant: 'Naturgesetze und praktische Vernunft bilden zwei Ordnungen.',
        gehlen: 'Naturdefizit zwingt zur kulturellen Entlastung.',
        loewith: 'Traditionen strukturieren Sinn, bleiben aber geschichtlich prekär.'
      }
    },
    {
      label: 'Gesellschaft',
      values: {
        plessner: 'Rollenspiele und Institutionen ermöglichen Distanz und Nähe.',
        marx: 'Klassengesellschaft; Veränderung durch kollektive Praxis.',
        kant: 'Rechtsstaat und Öffentlichkeit als Felder autonomer Bürger.',
        gehlen: 'Ordnung muss Stabilität sichern, um Überforderung zu vermeiden.',
        loewith: 'Gemeinschaften schwanken zwischen Glaubensbindung und Skepsis.'
      }
    },
    {
      label: 'Institutionen',
      values: {
        plessner: 'Eröffnen Perspektivenwechsel und halten Ambivalenzen aus.',
        marx: 'Sind Ausdruck von Produktionsverhältnissen und Herrschaft.',
        kant: 'Sollen Vernunftprinzipien und Freiheit garantieren.',
        gehlen: 'Entlasten, stiften Routinen, verhindern chaotische Spontaneität.',
        loewith: 'Werden historisch relativ, bleiben jedoch Deutungsanker.'
      }
    },
    {
      label: 'Kritik/Hinweise',
      values: {
        plessner: 'Gefahr: anthropologische Theorie bleibt neutral gegenüber Macht.',
        marx: 'Ökonomischer Fokus kann kulturelle Differenzen unterschätzen.',
        kant: 'Abstrakte Moral braucht soziale Einbettung.',
        gehlen: 'Konservativer Bias, geringe Sensibilität für Wandel.',
        loewith: 'Melancholischer Ton, wenig positive Handlungsperspektive.'
      }
    }
  ];

  kiNavigation = this.philosophers.map((philosopher) => ({
    label: philosopher.name,
    route: `/${philosopher.id}`
  }));

  currentSection = 'intro';
  menuOpen = false;
  showLanding = true;
  visitedCount = 0;
  readonly totalModels = 5;
  compareColumnCount = 3;
  compareSelections: string[] = [];
  private progressSub?: Subscription;

  @ViewChild('offcanvas') offcanvas?: ElementRef<HTMLElement>;
  @ViewChild('overlay') overlay?: ElementRef<HTMLElement>;
  @ViewChild('menuToggle') menuToggle?: ElementRef<HTMLButtonElement>;
  @ViewChild('menuStatus') menuStatus?: ElementRef<HTMLDivElement>;
  @ViewChildren('scrollTargetElement') scrollTargets?: QueryList<ElementRef<HTMLElement>>;

  private focusableMenuElements: HTMLElement[] = [];
  private lastFocused: Element | null = null;
  private scrollObserver?: IntersectionObserver;
  private resizeListener?: () => void;
  private keydownListener?: () => void;
  private reduceMotionQuery?: MediaQueryList;
  private reduceMotionListener?: (event: MediaQueryListEvent) => void;
  private resizeRaf?: number;
  private animationInstances: any[] = [];
  private pinTriggers: any[] = [];
  private mediaMatchContext: any;
  private animationRetryHandle?: number;
  private compareMediaQuery?: MediaQueryList;
  private compareMediaListener?: (event: MediaQueryListEvent) => void;

  private readonly isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

  constructor(
    private readonly renderer: Renderer2,
    private readonly router: Router,
    private readonly progressService: ProgressService
  ) {
    this.updateLandingState(this.router.url);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateLandingState(event.urlAfterRedirects);
      }
    });
    this.progressSub = this.progressService.progress$.subscribe((state) =>
      this.updateVisitedCount(state)
    );
  }

  ngOnInit(): void {
    this.initCompareSelections();
    if (this.isBrowser) {
      this.setupCompareColumnWatcher();
    } else {
      this.updateCompareColumnCount(3);
    }
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    this.setupReducedMotionWatcher();
    this.updateHeaderHeight();
    this.setupScrollSpy();
    this.scrollTargets?.changes.subscribe(() => this.setupScrollSpy());
    this.setupAnimations();

    this.resizeListener = this.renderer.listen('window', 'resize', () => {
      if (this.resizeRaf) {
        window.cancelAnimationFrame(this.resizeRaf);
      }
      this.resizeRaf = window.requestAnimationFrame(() => this.updateHeaderHeight());
    });

    this.keydownListener = this.renderer.listen('document', 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.closeMenu();
      }
    });
  }

  ngOnDestroy(): void {
    this.closeMenu(false);
    this.killAnimations();
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
    if (this.resizeListener) {
      this.resizeListener();
    }
    if (this.keydownListener) {
      this.keydownListener();
    }
    if (this.reduceMotionQuery && this.reduceMotionListener) {
      this.reduceMotionQuery.removeEventListener('change', this.reduceMotionListener);
    }
    if (this.compareMediaQuery && this.compareMediaListener) {
      this.compareMediaQuery.removeEventListener('change', this.compareMediaListener);
    }
    if (this.animationRetryHandle) {
      window.clearTimeout(this.animationRetryHandle);
    }
    this.progressSub?.unsubscribe();
  }

  toggleMenu(): void {
    if (this.menuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu(): void {
    if (!this.isBrowser || this.menuOpen) {
      return;
    }
    this.menuOpen = true;
    this.renderer.addClass(document.body, 'menu-open');
    this.lastFocused = document.activeElement;
    this.announce('Menü geöffnet');
    setTimeout(() => {
      this.updateFocusableMenuElements();
      this.focusFirstMenuElement();
    }, 20);
  }

  closeMenu(restoreFocus = true): void {
    if (!this.isBrowser || !this.menuOpen) {
      return;
    }
    this.menuOpen = false;
    this.renderer.removeClass(document.body, 'menu-open');
    this.announce('Menü geschlossen');
    if (restoreFocus && this.lastFocused instanceof HTMLElement) {
      this.lastFocused.focus();
    }
    this.lastFocused = null;
  }

  handleMenuKeydown(event: KeyboardEvent): void {
    if (!this.menuOpen || event.key !== 'Tab' || !this.offcanvas) {
      return;
    }
    if (!this.focusableMenuElements.length) {
      event.preventDefault();
      return;
    }
    const first = this.focusableMenuElements[0];
    const last = this.focusableMenuElements[this.focusableMenuElements.length - 1];
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  onMenuLinkClick(event: Event, id: string): void {
    event.preventDefault();
    if (this.router.url !== '/') {
      this.closeMenu(false);
      this.router.navigate(['/']).then(() => {
        setTimeout(() => this.scrollToSection(id), 150);
      });
      return;
    }
    this.scrollToSection(id);
  }

  onStripClick(id: string): void {
    this.scrollToSection(id);
  }

  announceSoon(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.announce('Quiz bald verfügbar');
  }

  private focusFirstMenuElement(): void {
    if (!this.focusableMenuElements.length) {
      return;
    }
    const target = this.focusableMenuElements[0];
    target.focus();
  }

  private updateFocusableMenuElements(): void {
    if (!this.offcanvas || !this.menuOpen) {
      this.focusableMenuElements = [];
      return;
    }
    const elements = Array.from(
      this.offcanvas.nativeElement.querySelectorAll<HTMLElement>(focusableSelectors)
    );
    this.focusableMenuElements = elements.filter(
      (element) => element.getAttribute('aria-disabled') !== 'true'
    );
  }

  private scrollToSection(id: string): void {
    if (!this.isBrowser) {
      return;
    }
    const target = document.getElementById(id);
    if (!target) {
      return;
    }
    const behavior: ScrollBehavior =
      this.reduceMotionQuery && this.reduceMotionQuery.matches ? 'auto' : 'smooth';
    target.scrollIntoView({ behavior, block: 'start' });
    this.setActiveSection(id);
    if (this.menuOpen) {
      this.closeMenu();
    }
    const focusTarget = () => {
      if (typeof (target as HTMLElement).focus === 'function') {
        (target as HTMLElement).focus({ preventScroll: true } as FocusOptions);
      }
    };
    if (behavior === 'auto') {
      focusTarget();
    } else {
      setTimeout(focusTarget, 600);
    }
  }

  private setupScrollSpy(): void {
    if (!this.isBrowser) {
      return;
    }
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
    const targets =
      this.scrollTargets?.toArray().map((ref) => ref.nativeElement as HTMLElement) ?? [];
    if (!targets.length) {
      return;
    }
    this.scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0.2
      }
    );
    targets.forEach((element) => this.scrollObserver?.observe(element));
    this.setActiveSection('intro');
  }

  private setActiveSection(id: string): void {
    if (this.currentSection === id) {
      return;
    }
    this.currentSection = id;
  }

  private updateHeaderHeight(): void {
    if (!this.isBrowser) {
      return;
    }
    const header = document.getElementById('site-header');
    if (!header) {
      return;
    }
    const height = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--header-height', `${height}px`);
  }

  private announce(message: string): void {
    if (!this.menuStatus || !this.isBrowser) {
      return;
    }
    const element = this.menuStatus.nativeElement;
    element.textContent = '';
    window.requestAnimationFrame(() => {
      element.textContent = message;
    });
  }

  private updateLandingState(url: string): void {
    if (!url) {
      this.showLanding = true;
      return;
    }
    const cleaned = url.split('?')[0].split('#')[0];
    this.showLanding = cleaned === '/' || cleaned === '';
  }

  private updateVisitedCount(state: ProgressState): void {
    const visited = Object.values(state).filter(Boolean).length;
    this.visitedCount = visited;
  }

  private setupReducedMotionWatcher(): void {
    if (!this.isBrowser) {
      return;
    }
    this.reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.toggleReducedMotionClass(this.reduceMotionQuery.matches);
    this.reduceMotionListener = (event: MediaQueryListEvent) => {
      this.toggleReducedMotionClass(event.matches);
      if (event.matches) {
        this.killAnimations();
      } else {
        this.setupAnimations();
      }
    };
    this.reduceMotionQuery.addEventListener('change', this.reduceMotionListener);
  }

  private initCompareSelections(): void {
    const defaults = ['marx', 'plessner', 'kant'];
    this.compareSelections = defaults.filter((id) =>
      this.philosophers.some((philosopher) => philosopher.id === id)
    );
    this.ensureCompareSelectionCount();
  }

  private setupCompareColumnWatcher(): void {
    if (!this.isBrowser) {
      return;
    }
    this.compareMediaQuery = window.matchMedia('(max-width: 900px)');
    this.updateCompareColumnCount(this.compareMediaQuery.matches ? 2 : 3);
    this.compareMediaListener = (event: MediaQueryListEvent) => {
      this.updateCompareColumnCount(event.matches ? 2 : 3);
    };
    this.compareMediaQuery.addEventListener('change', this.compareMediaListener);
  }

  private updateCompareColumnCount(count: number): void {
    if (this.compareColumnCount === count) {
      return;
    }
    this.compareColumnCount = count;
    this.ensureCompareSelectionCount();
  }

  private ensureCompareSelectionCount(): void {
    const unique: string[] = [];
    this.compareSelections.forEach((id) => {
      if (id && !unique.includes(id)) {
        unique.push(id);
      }
    });
    this.compareSelections = unique.slice(0, this.compareColumnCount);
    while (this.compareSelections.length < this.compareColumnCount) {
      const next = this.findNextPhilosopherId(this.compareSelections);
      this.compareSelections.push(next ?? '');
    }
  }

  private findNextPhilosopherId(exclude: string[]): string | null {
    const philosopher = this.philosophers.find((item) => !exclude.includes(item.id));
    return philosopher ? philosopher.id : null;
  }

  get visibleCompareSelections(): string[] {
    return this.compareSelections.slice(0, this.compareColumnCount);
  }

  getPhilosopherById(id: string | null | undefined): Philosopher | undefined {
    if (!id) {
      return undefined;
    }
    return this.philosophers.find((philosopher) => philosopher.id === id);
  }

  isOptionDisabled(id: string, slotIndex: number): boolean {
    return this.compareSelections.some((selected, index) => index !== slotIndex && selected === id);
  }

  onCompareSelectionChange(slotIndex: number, philosopherId: string): void {
    if (!philosopherId) {
      return;
    }
    const duplicateIndex = this.compareSelections.findIndex(
      (selected, index) => index !== slotIndex && selected === philosopherId
    );
    this.compareSelections[slotIndex] = philosopherId;
    if (duplicateIndex >= 0) {
      const fallback = this.findNextPhilosopherId(
        this.compareSelections.filter((_, idx) => idx !== duplicateIndex)
      );
      this.compareSelections[duplicateIndex] = fallback ?? '';
    }
    this.ensureCompareSelectionCount();
  }

  trackCompareCard(index: number, selection: string): string {
    return selection ? `${index}-${selection}` : `slot-${index}`;
  }

  getRowSharedValue(row: CompareRow): string | null {
    const selections = this.visibleCompareSelections;
    if (!selections.length) {
      return null;
    }
    const baseValue = row.values[selections[0]];
    if (!baseValue) {
      return null;
    }
    const allEqual = selections.every((id) => row.values[id] === baseValue);
    return allEqual ? baseValue : null;
  }

  getRowEntries(row: CompareRow): Array<{ id: string; name: string; value: string }> {
    return this.visibleCompareSelections.map((id) => {
      const philosopher = this.getPhilosopherById(id);
      return {
        id,
        name: philosopher?.name ?? 'Unbekannt',
        value: row.values[id] ?? '—'
      };
    });
  }

  private toggleReducedMotionClass(enable: boolean): void {
    if (!this.isBrowser) {
      return;
    }
    if (enable) {
      this.renderer.addClass(document.documentElement, 'reduced-motion');
    } else {
      this.renderer.removeClass(document.documentElement, 'reduced-motion');
    }
  }

  private setupAnimations(): void {
    if (!this.isBrowser) {
      return;
    }
    if (this.reduceMotionQuery?.matches) {
      this.killAnimations();
      return;
    }
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger) {
      this.animationRetryHandle = window.setTimeout(() => this.setupAnimations(), 200);
      return;
    }
    this.killAnimations();
    gsap.registerPlugin(ScrollTrigger);
    this.mediaMatchContext = ScrollTrigger.matchMedia();

    this.animationInstances.push(
      gsap.from('.site-title', {
        opacity: 0,
        y: 18,
        scale: 0.96,
        duration: 1,
        ease: 'power2.out'
      })
    );

    this.animationInstances.push(
      gsap.from('.intro__inner', {
        opacity: 0,
        y: 24,
        duration: 1,
        delay: 0.1,
        ease: 'power2.out'
      })
    );

    const sections = gsap.utils.toArray('.philosopher-section') as HTMLElement[];
    sections.forEach((section: HTMLElement) => {
      const content = section.querySelector('.philosopher-content');
      const listItems = section.querySelectorAll('.philosopher-ideas li');

      if (content) {
        this.animationInstances.push(
          gsap.from(content, {
            opacity: 0,
            y: 24,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none reverse'
            }
          })
        );
      }

      if (listItems.length) {
        this.animationInstances.push(
          gsap.from(listItems, {
            opacity: 0,
            y: 16,
            duration: 0.45,
            ease: 'power1.out',
            stagger: 0.08,
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              toggleActions: 'play none none reverse'
            }
          })
        );
      }
    });

    const compareCards = gsap.utils.toArray('#compare-cards .compare-card') as HTMLElement[];
    if (compareCards.length) {
      this.animationInstances.push(
        gsap.from(compareCards, {
          opacity: 0,
          y: 24,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.12,
          scrollTrigger: {
            trigger: '#vergleichen',
            start: 'top 80%'
          }
        })
      );
    }

    this.mediaMatchContext.add('(min-width: 901px)', () => {
      const localPins: any[] = [];
      (gsap.utils.toArray('.philosopher-section') as HTMLElement[]).forEach((section: HTMLElement) => {
        const figure = section.querySelector('.philosopher-figure');
        if (!figure) {
          return;
        }
        const trigger = ScrollTrigger.create({
          trigger: section,
          start: 'top+=80 top',
          end: 'bottom bottom-=120',
          pin: figure,
          pinSpacing: false
        });
        localPins.push(trigger);
      });
      this.pinTriggers.push(...localPins);
      return () => {
        localPins.forEach((trigger) => trigger.kill());
        this.pinTriggers = this.pinTriggers.filter((trigger) => !localPins.includes(trigger));
      };
    });
  }

  private killAnimations(): void {
    if (!this.isBrowser) {
      return;
    }
    if (this.animationRetryHandle) {
      window.clearTimeout(this.animationRetryHandle);
      this.animationRetryHandle = undefined;
    }
    this.animationInstances.forEach((instance) => {
      if (!instance) {
        return;
      }
      if (typeof instance.progress === 'function') {
        instance.progress(1);
      }
      if (instance.scrollTrigger) {
        instance.scrollTrigger.kill();
      }
      if (typeof instance.kill === 'function') {
        instance.kill();
      }
    });
    this.animationInstances = [];
    this.pinTriggers.forEach((trigger) => trigger.kill());
    this.pinTriggers = [];
    if (this.mediaMatchContext && typeof this.mediaMatchContext.kill === 'function') {
      this.mediaMatchContext.kill();
      this.mediaMatchContext = null;
    }
  }
}
