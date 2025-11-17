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
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProgressService, ProgressState } from './services/progress.service';

declare global {
  interface Window {
    gsap?: any;
    ScrollTrigger?: any;
  }
}

interface PhilosopherReference {
  label: string;
  url: string;
}

interface PhilosopherProfile {
  birth: string;
  death: string;
  lifeEvents: string[];
  coreIdeas: string[];
  references: PhilosopherReference[];
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
  profile: PhilosopherProfile;
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
  imports: [NgFor, NgIf, NgClass, RouterLink, RouterLinkActive, RouterOutlet, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  showExtendedContent = false;
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
      profile: {
        birth: '* 4. September 1892 (Wiesbaden)',
        death: '† 12. Juni 1985 (Göttingen)',
        lifeEvents: [
          'studierte ab 1910 zunächst Medizin und Zoologie',
          'wandte sich ab 1916 zunehmend der Philosophie zu',
          '1928 erschien sein Hauptwerk „Die Stufen des Organischen und der Mensch. Einleitung in die philosophische Anthropologie“ mit dem Konzept der „exzentrischen Positionalität“',
          'wegen seines jüdischen Elternhauses wurde er in der NS-Zeit nach Istanbul vertrieben',
          'Rückkehr nach Kriegsende',
          'lehrte anschließend in New York und Zürich und veröffentlichte bis 1975 zahlreiche philosophische Essays'
        ],
        coreIdeas: [
          'Mensch besitzt „exzentrische Positionalität“',
          'kann sich von außen (objektiv) und von innen (subjektiv) betrachten'
        ],
        references: [
          {
            label: 'https://de.wikipedia.org/wiki/Helmuth_Plessner',
            url: 'https://de.wikipedia.org/wiki/Helmuth_Plessner'
          },
          {
            label: 'https://www.wiesbaden.de/stadtlexikon/stadtlexikon-a-z/plessner-helmuth',
            url: 'https://www.wiesbaden.de/stadtlexikon/stadtlexikon-a-z/plessner-helmuth'
          }
        ]
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
      profile: {
        birth: '* 5. Mai 1818 (Trier)',
        death: '† 14. März 1883 (London)',
        lifeEvents: [
          'studierte ab 1835 Rechtswissenschaften',
          'erweiterte 1836-1841 sein Studium um die Philosophie',
          'traf 1842 Friedrich Engels in Köln',
          'verfasste 1847 mit Engels eine Schrift zur Reorganisation des Bundes',
          'veröffentlichte 1848 das „Manifest der Kommunistischen Partei“',
          'legte 1859 seine Kritik des Kapitalismus vor',
          'arbeitete bei zahlreichen Zeitschriften und schrieb weitere Texte seiner kommunistischen Idee'
        ],
        coreIdeas: [
          'der Mensch kann sich nur durch Arbeit verwirklichen',
          'er entfremdet sich durch den Kapitalismus von der Arbeit'
        ],
        references: [
          {
            label: 'https://www.dhm.de/lemo/biografie/karl-marx',
            url: 'https://www.dhm.de/lemo/biografie/karl-marx'
          }
        ]
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
        className: 'portrait-real portrait-zoom portrait-zoom-strip portrait-figure-kant'
      },
      profile: {
        birth: '*22. April 1724 (Königsberg)',
        death: '† 12. Februar 1804 (Königsberg)',
        lifeEvents: [
          'begann 1740 mit dem Philosophie-Studium',
          'arbeitete zehn Jahre als Hauslehrer und setzte dann sein Studium fort',
          'verfasste 1754 sein erstes wichtiges Werk „Allgemeine Naturgeschichte und Theorie des Himmels“ über die Größe des Universums',
          'arbeitete ab 1770 als Professor für Logik und Metaphysik in Königsberg',
          'veröffentlichte 1781 sein zentrales Werk „Kritik der reinen Vernunft“ mit den Fragen „Was kann ich wissen? Was soll ich tun? Was darf ich hoffen? Was ist der Mensch?“',
          'Aufklärungsdenken ist maßgeblich auf ihn zurückzuführen'
        ],
        coreIdeas: [
          'der Mensch ist ein „ungeselliger Geselle“',
          'er steht zwischen seinem Egoismus und der Gesellschaft; diese Spannung nennt er Antagonismus'
        ],
        references: [
          {
            label: 'https://www.geo.de/geolino/mensch/1437-rtkl-weltveraenderer-immanuel-kant',
            url: 'https://www.geo.de/geolino/mensch/1437-rtkl-weltveraenderer-immanuel-kant'
          },
          {
            label: 'https://studyflix.de/allgemeinwissen/immanuel-kant-5125',
            url: 'https://studyflix.de/allgemeinwissen/immanuel-kant-5125'
          }
        ]
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
      profile: {
        birth: '*29. Januar 1904 (Leipzig)',
        death: '† 30. Januar 1976 (Hamburg)',
        lifeEvents: [
          'studierte bis 1927 Philosophie, Germanistik, Psychologie und Kunstgeschichte',
          'war 1930 bis 1934 Privatdozent für Philosophie in Leipzig',
          'trat 1933 der NSDAP bei',
          'lehrte 1934 bis 1969 als ordentlicher Professor für Philosophie und Soziologie in Leipzig, Kaliningrad, Wien und Aachen',
          'wurde in Entnazifizierungsverfahren überprüft'
        ],
        coreIdeas: [
          'der Mensch ist ein „Mängelwesen“',
          'er ist nicht durch spezielle Organe und Instinkte an Umwelt angepasst'
        ],
        references: [
          {
            label: 'https://agso.uni-graz.at/archive/lexikon/klassiker/gehlen/16bio.htm#',
            url: 'https://agso.uni-graz.at/archive/lexikon/klassiker/gehlen/16bio.htm#'
          }
        ]
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
      profile: {
        birth: '*9. Januar 1897 (München)',
        death: '† 25. Mai 1973 (Heidelberg)',
        lifeEvents: [
          'geriet nach dem Abitur in italienische Kriegsgefangenschaft',
          'Rückkehr 1919 und Beginn eines Philosophie- und Biologie-Studiums bis 1922',
          'wanderte 1934 als Jude nach Rom aus und wurde 1936 Professor an einer japanischen Universität',
          'kam 1952 nach Deutschland zurück, nachdem er elf Jahre in den USA tätig war',
          'lehrte bis 1964 an der Universität Heidelberg und veröffentlichte weitere philosophische Schriften'
        ],
        coreIdeas: [
          'der Mensch ist ein „Kulturwesen“',
          'er ist ein Teil der Natur, kann sie „erkennen“ und hinterfragen, wodurch er sich jedoch von ihr entfremdet'
        ],
        references: [
          {
            label: 'https://www.deutsche-biographie.de/gnd118574043.html#ndbcontent',
            url: 'https://www.deutsche-biographie.de/gnd118574043.html#ndbcontent'
          },
          { label: 'https://de.wikipedia.org/wiki/Karl_Löwith', url: 'https://de.wikipedia.org/wiki/Karl_Löwith' }
        ]
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
      label: '(1) Wesen/Eigenschaften des Menschen',
      values: {
        marx:
          '- Mensch ist produktiv, sozial und ein Gattungswesen, das Gesellschaft braucht\n- er verwirklicht sich durch gewollte Arbeit\n- gestaltet die Welt und drückt sich über sein Produkt aus\n- wird im Kapitalismus von der Arbeit entfremdet',
        plessner:
          '- Mensch ist ein Grenzwesen zwischen Natur und Kultur\n- er besitzt „exzentrische Positionalität“\n- hat Doppelaspektivität zwischen Leib und Körper\n- reflektiert die Vergangenheit und plant die Zukunft objektiv',
        loewith:
          '- Mensch ist ein Kulturwesen\n- er „erkennt“ die Natur und distanziert sich\n- schafft Kultur um Instinktmangel auszugleichen\n- ist von Naturgesetzen abhängig, lebt aber in Kultur',
        gehlen:
          '- Mensch ist ein Mängelwesen (instinktarm, unspezialisiert)\n- er braucht Institutionen für Stabilität und Orientierung\n- muss seine Umwelt aktiv umgestalten\n- ist lernfähig und muss Erkenntnis gewinnen',
        kant:
          '- Mensch ist ein ungeselliger Geselle\n- er ist im Zwiespalt zwischen Egoismus und Gesellschaft\n- steht in Konkurrenz zu anderen\n- kann manche Ziele nur zusammen erreichen'
      }
    },
    {
      label: '(2) Unterschiede und Gemeinsamkeiten zum Tier',
      values: {
        marx:
          '- Tiere arbeiten zweckgebunden und instinktiv\n- Mensch arbeitet bewusst und freiwillig\n- Unterschied ist die freie Produktivität des Menschen',
        plessner:
          '- Tiere besitzen „geschlossene Positionalität“ und haben keinen Außenaspekt\n- Mensch hat einen Außenaspekt und betrachtet sich objektiv\n- beide sind organisch und von der Natur abgegrenzt',
        loewith:
          '- Tiere „kennen“ ihre Natur (ohne Reflexion)\n- Mensch „erkennt“ seine Natur (mit Reflexion)\n- Tiere leben unmittelbar in der Natur, aber Mensch distanziert sich durch Kultur',
        gehlen:
          '- Tiere folgen ausschließlich ihren Instinkten und sind spezialisiert\n- Mensch hat Instinktschwäche, ist unspezialisiert und unsicher/orientierungslos\n- Mensch muss künstlich überleben',
        kant:
          '- Mensch hat eine Doppelnatur: gesellig und ungesellig\n- nur Menschen haben Moral und Vernunft\n- Mensch strebt nach Fortschritt und Weiterentwicklung'
      }
    },
    {
      label: '(3) Bedeutung der Natur/Umwelt',
      values: {
        marx:
          '- ist der Raum, in dem der Mensch seine Arbeit verrichtet\n- Natur und Umwelt sind Grundlage zur Gestaltung',
        plessner:
          '- Natur ist ein Bestandteil seines „Ichs“\n- Natur gibt körperliche Grundlage\n- Mensch kann nie vollständig in der Natur aufgehen',
        loewith:
          '- Mensch ist direkter Teil der Natur\n- Natur ist der Ursprung, aber nicht die Heimat\n- Natur beherrscht den Menschen durch Gesetze etc.',
        gehlen:
          '- Natur überfordert den Menschen, ohne Kultur nicht lebensfähig\n- Natur ist Grundlage zur Umformung (z.B. Ressourcen)\n- Natur macht den Menschen zum Mängelwesen',
        kant:
          '- Natur gibt dem Menschen seinen Egoismus\n- Neid, Ehrgeiz und Konkurrenz sind natürliche Antriebe'
      }
    },
    {
      label: '(4) Bedeutung der Kultur/Normen und Regeln',
      values: {
        marx:
          '- Kultur ist die Voraussetzung für Ökonomie\n- entsteht aus den Klassen\n- Kultur wird zur Entfremdung umgewandelt',
        plessner:
          '- Kultur ist „natürliche Künstlichkeit“\n- Reaktion auf die exzentrische Positionalität\n- Kultur hilft, die Spannung zwischen dem Innen- und Außenaspekt, wie Selbstzweifel, zu minimieren',
        loewith:
          '- Kultur ist das Ergebnis der Distanzierung von der Natur\n- zeigt Erkennen, Denken, und Freiheit des Menschen\n- ersetzt Mängel durch Ordnung und Orientierung',
        gehlen:
          '- Kultur ist die „zweite Natur des Menschen“\n- ersetzt fehlende Instinkte\n- ohne Kultur und deren Institutionen wäre der Mensch nicht überlebensfähig',
        kant:
          '- garantiert Austausch, Kooperation und Recht\n- Entwicklung von Wissen und Institutionen\n- Verursacht Streit und somit Fortschritt\n- Ergebnis von Vernunft und Moral'
      }
    },
    {
      label: '(5) Bedeutung der Gesellschaft',
      values: {
        marx:
          '- Struktur der Klassen\n- sehr wichtig für den Menschen als Gattungswesen\n- bestimmt das Wesen des Menschen',
        plessner:
          '- stabilisiert den Menschen, da sie Normen gibt\n- Normen verhindern Unsicherheit und Chaos\n- Mensch braucht Gesellschaft als Orientierung',
        loewith:
          '- Gesellschaft gibt Ordnung und Verhalten, das Instinkte ersetzt\n- Mensch wird durch Zusammenleben und Reflexion zum Kulturwesen\n- Gesellschaft gibt Rituale, Traditionen, Sprache und Technik',
        gehlen:
          '- lebensnotwendig für Instinktschwäche\n- Institutionen wie Familie geben Sicherheit\n- Gesellschaft schützt vor Chaos, durch vorhersehbare Strukturen',
        kant:
          '- Grundlage für Konflikte und Spannungen\n- ermöglicht Ziele, die nicht allein erreichbar sind\n- gibt dem Menschen Halt'
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
  private viewInitialized = false;
  private progressSub?: Subscription;

  @ViewChild('offcanvas') offcanvas?: ElementRef<HTMLElement>;
  @ViewChild('overlay') overlay?: ElementRef<HTMLElement>;
  @ViewChild('menuToggle') menuToggle?: ElementRef<HTMLButtonElement>;
  @ViewChild('menuStatus') menuStatus?: ElementRef<HTMLDivElement>;
  @ViewChildren('scrollTargetElement') scrollTargets?: QueryList<ElementRef<HTMLElement>>;

  private focusableMenuElements: HTMLElement[] = [];
  private lastFocused: Element | null = null;
  private scrollObserver?: IntersectionObserver;
  private scrollRevealObserver?: IntersectionObserver;
  private resizeListener?: () => void;
  private keydownListener?: () => void;
  private reduceMotionQuery?: MediaQueryList;
  private reduceMotionListener?: (event: MediaQueryListEvent) => void;
  private resizeRaf?: number;
  private animationInstances: any[] = [];
  private animationRetryHandle?: number;
  private compareMediaQuery?: MediaQueryList;
  private compareMediaListener?: (event: MediaQueryListEvent) => void;
  private pendingRevealElements: Set<HTMLElement> = new Set();
  private revealScrollListener?: () => void;
  private revealFallbackResizeListener?: () => void;
  private revealFallbackRaf?: number;

  private readonly isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

  constructor(
    private readonly renderer: Renderer2,
    private readonly router: Router,
    private readonly progressService: ProgressService
  ) {
    if (this.isBrowser) {
      this.compareColumnCount = window.matchMedia('(max-width: 900px)').matches ? 2 : 3;
    }
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

    this.viewInitialized = true;
    this.setupReducedMotionWatcher();
    this.setupScrollRevealObserver();
    this.updateHeaderHeight();
    this.setupScrollSpy();
    this.scrollTargets?.changes.subscribe(() => {
      this.setupScrollSpy();
      this.setupScrollRevealObserver();
    });
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
    this.destroyScrollRevealObserver();
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

  private setupScrollRevealObserver(): void {
    if (!this.isBrowser || !this.showLanding) {
      this.destroyScrollRevealObserver();
      return;
    }
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('.reveal-on-scroll')
    );
    if (!elements.length) {
      this.destroyScrollRevealObserver();
      this.pendingRevealElements.clear();
      this.teardownRevealFallback();
      return;
    }

    if (this.reduceMotionQuery?.matches) {
      this.destroyScrollRevealObserver();
      elements.forEach((element) => element.classList.add('is-visible'));
      this.pendingRevealElements.clear();
      this.teardownRevealFallback();
      return;
    }

    if (!('IntersectionObserver' in window)) {
      this.destroyScrollRevealObserver();
      elements.forEach((element) => element.classList.add('is-visible'));
      this.pendingRevealElements.clear();
      this.teardownRevealFallback();
      return;
    }

    const pendingElements = this.filterRevealElements(elements);
    if (!pendingElements.length) {
      this.destroyScrollRevealObserver();
      this.pendingRevealElements.clear();
      this.teardownRevealFallback();
      return;
    }

    this.destroyScrollRevealObserver();
    this.scrollRevealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
            this.pendingRevealElements.delete(entry.target as HTMLElement);
          }
        });
        if (!this.pendingRevealElements.size) {
          this.teardownRevealFallback();
        }
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    this.pendingRevealElements = new Set(pendingElements);
    pendingElements.forEach((element) => this.scrollRevealObserver?.observe(element));
    this.setupRevealFallback();
  }

  private destroyScrollRevealObserver(): void {
    if (this.scrollRevealObserver) {
      this.scrollRevealObserver.disconnect();
      this.scrollRevealObserver = undefined;
    }
    this.pendingRevealElements.clear();
    this.teardownRevealFallback();
  }

  private filterRevealElements(elements: HTMLElement[]): HTMLElement[] {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    return elements.filter((element) => {
      element.classList.add('reveal-ready');
      if (element.classList.contains('is-visible')) {
        return false;
      }
      if (this.isElementInRevealViewport(element, viewportHeight)) {
        element.classList.add('is-visible');
        return false;
      }
      return true;
    });
  }

  private isElementInRevealViewport(element: HTMLElement, viewportHeight: number): boolean {
    if (!viewportHeight) {
      return false;
    }
    const rect = element.getBoundingClientRect();
    const upperThreshold = viewportHeight * 0.85;
    const lowerThreshold = viewportHeight * -0.1;
    return rect.top <= upperThreshold && rect.bottom >= lowerThreshold;
  }

  private setupRevealFallback(): void {
    if (!this.isBrowser) {
      return;
    }
    if (!this.pendingRevealElements.size) {
      this.teardownRevealFallback();
      return;
    }
    if (!this.revealScrollListener) {
      const handler = () => this.scheduleRevealFallbackCheck();
      this.revealScrollListener = this.renderer.listen('window', 'scroll', handler);
      this.revealFallbackResizeListener = this.renderer.listen('window', 'resize', handler);
    }
    this.scheduleRevealFallbackCheck();
  }

  private scheduleRevealFallbackCheck(): void {
    if (!this.isBrowser || !this.pendingRevealElements.size) {
      this.teardownRevealFallback();
      return;
    }
    if (this.revealFallbackRaf) {
      return;
    }
    this.revealFallbackRaf = window.requestAnimationFrame(() => {
      this.revealFallbackRaf = undefined;
      this.runRevealFallbackCheck();
    });
  }

  private runRevealFallbackCheck(): void {
    if (!this.isBrowser) {
      return;
    }
    if (!this.pendingRevealElements.size) {
      this.teardownRevealFallback();
      return;
    }
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const elementsToClear: HTMLElement[] = [];
    this.pendingRevealElements.forEach((element) => {
      if (this.isElementInRevealViewport(element, viewportHeight)) {
        element.classList.add('is-visible');
        elementsToClear.push(element);
      }
    });
    elementsToClear.forEach((element) => {
      this.pendingRevealElements.delete(element);
      this.scrollRevealObserver?.unobserve(element);
    });
    if (!this.pendingRevealElements.size) {
      this.teardownRevealFallback();
    }
  }

  private teardownRevealFallback(): void {
    if (this.revealScrollListener) {
      this.revealScrollListener();
      this.revealScrollListener = undefined;
    }
    if (this.revealFallbackResizeListener) {
      this.revealFallbackResizeListener();
      this.revealFallbackResizeListener = undefined;
    }
    if (this.revealFallbackRaf) {
      window.cancelAnimationFrame(this.revealFallbackRaf);
      this.revealFallbackRaf = undefined;
    }
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
      const changed = !this.showLanding;
      this.showLanding = true;
      if (changed) {
        this.handleLandingToggle(true);
      }
      return;
    }
    const cleaned = url.split('?')[0].split('#')[0];
    const isLanding = cleaned === '/' || cleaned === '';
    const changed = this.showLanding !== isLanding;
    this.showLanding = isLanding;
    if (changed) {
      this.handleLandingToggle(isLanding);
    }
  }

  private handleLandingToggle(isLanding: boolean): void {
    if (!this.isBrowser || !this.viewInitialized) {
      return;
    }
    if (isLanding) {
      window.requestAnimationFrame(() => this.setupScrollRevealObserver());
    } else {
      this.destroyScrollRevealObserver();
    }
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
      this.setupScrollRevealObserver();
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
    this.compareSelections = [...this.compareSelections];
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
    if (this.isBrowser) {
      const scrollTrigger = window.ScrollTrigger;
      if (scrollTrigger && typeof scrollTrigger.getAll === 'function') {
        scrollTrigger.getAll().forEach((trigger: any) => {
          if (trigger && trigger.pin && trigger.trigger?.classList?.contains('philosopher-section')) {
            trigger.kill();
          }
        });
      }
    }
  }
}
