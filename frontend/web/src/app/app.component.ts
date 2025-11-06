import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProgressService, ProgressState } from './services/progress.service';

declare global {
  interface Window {
    gsap?: any;
    ScrollTrigger?: any;
  }
}

interface PortraitConfig {
  base: string;
  accent: string;
  detail: string;
  highlight: string;
  accentY?: number;
  accentR?: number;
  detailRx?: number;
  detailRy?: number;
  overlayOpacity?: number;
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

function buildPortrait({
  base,
  accent,
  detail,
  highlight,
  accentY = 150,
  accentR = 120,
  detailRx = 110,
  detailRy = 90,
  overlayOpacity = 0.35
}: PortraitConfig): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 400'><rect width='320' height='400' fill='${base}'/><circle cx='160' cy='${accentY}' r='${accentR}' fill='${accent}' fill-opacity='0.82'/><ellipse cx='160' cy='260' rx='${detailRx}' ry='${detailRy}' fill='${detail}' opacity='0.9'/><path d='M90 120 Q160 ${accentY - 60} 230 120' stroke='${highlight}' stroke-width='12' stroke-linecap='round' stroke-opacity='0.45' fill='none'/><path d='M110 320h100v26H110z' fill='${highlight}' opacity='${overlayOpacity}'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit, OnDestroy {
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
        thumb: buildPortrait({
          base: '#2c211b',
          accent: '#d0b385',
          detail: '#3a2f27',
          highlight: '#e9e1d6',
          accentY: 148,
          accentR: 118,
          detailRx: 112,
          detailRy: 86,
          overlayOpacity: 0.3
        }),
        alt: 'Abstraktes Porträt von Helmuth Plessner in warmen Brauntönen.',
        caption: 'Helmuth Plessner (Illustration)'
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
        'Marx analysiert den Menschen als produktives Gattungswesen, das sich durch gesellschaftliche Arbeit entfaltet und entfremdet werden kann.',
      keyline: 'Emanzipation entsteht in der Veränderung materieller Verhältnisse.',
      portrait: {
        thumb: buildPortrait({
          base: '#2a1f19',
          accent: '#d0b385',
          detail: '#3f3128',
          highlight: '#c3a87c',
          accentY: 160,
          accentR: 125,
          detailRx: 118,
          detailRy: 92,
          overlayOpacity: 0.28
        }),
        alt: 'Abstraktes Porträt von Karl Marx mit kräftigen Brauntönen.',
        caption: 'Karl Marx (Illustration)'
      },
      ideas: [
        'Historischer Materialismus: Bewusstsein folgt den Lebensverhältnissen.',
        'Arbeit als schöpferische Tätigkeit, die im Kapitalismus entfremdet wird.',
        'Kritik der politischen Ökonomie als Analyse von Macht- und Eigentumsstrukturen.',
        'Praxis und Revolution als kollektiver Prozess zur Aufhebung von Entfremdung.'
      ],
      quote:
        'Die Philosophen haben die Welt nur verschieden interpretiert; es kommt drauf an, sie zu verändern.',
      quoteSource: 'Marx, Thesen über Feuerbach (1845)'
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
        thumb: buildPortrait({
          base: '#2d221c',
          accent: '#d4b88d',
          detail: '#352a22',
          highlight: '#f0e4d1',
          accentY: 140,
          accentR: 110,
          detailRx: 102,
          detailRy: 80,
          overlayOpacity: 0.32
        }),
        alt: 'Abstraktes Porträt von Immanuel Kant mit hellen Highlights.',
        caption: 'Immanuel Kant (Illustration)'
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
        thumb: buildPortrait({
          base: '#271e18',
          accent: '#caa778',
          detail: '#3b2d25',
          highlight: '#d9c5aa',
          accentY: 158,
          accentR: 122,
          detailRx: 116,
          detailRy: 94,
          overlayOpacity: 0.33
        }),
        alt: 'Abstraktes Porträt von Arnold Gehlen mit gedeckten Strukturen.',
        caption: 'Arnold Gehlen (Illustration)'
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
        thumb: buildPortrait({
          base: '#211914',
          accent: '#cdaa80',
          detail: '#36291f',
          highlight: '#e6d6be',
          accentY: 146,
          accentR: 116,
          detailRx: 108,
          detailRy: 88,
          overlayOpacity: 0.29
        }),
        alt: 'Abstraktes Porträt von Karl Löwith mit kontrastreichen Flächen.',
        caption: 'Karl Löwith (Illustration)'
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
