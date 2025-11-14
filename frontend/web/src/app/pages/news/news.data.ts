export type PhilosopherKey = 'marx' | 'plessner' | 'gehlen' | 'loewith' | 'kant';

export interface NewsImage {
  src: string;
  alt: string;
  credit?: string;
}

export interface NewsArticle {
  id: string;
  philosopher: PhilosopherKey;
  kicker: string;
  title: string;
  teaser: string;
  body: string[];
  image: NewsImage;
  sourceUrl?: string;
  heroLead?: string;
}

export interface MeistgelesenEntry {
  articleId: string;
  label: string;
}

export const HERO_ARTICLE_ID = 'marx-2';
export const HERO_TEASER_IDS = ['marx-1', 'gehlen-1', 'loewith-1'];

export const TICKER_HEADLINES = [
  'Flughafen liegt lahm – Warnstreiks im Frühjahr 2025',
  'Immer mehr Menschen in Arbeit unzufrieden! – Karl Marx',
  'Social Media verzerrt Selbstbild',
  'Sommer 2021 – Zwei Italienerinnen in Alpen erfroren',
  'Fridays for Future kämpft gegen den Klimawandel',
];

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'marx-1',
    philosopher: 'marx',
    kicker: 'Aktuelles · Karl Marx',
    title: '„Immer mehr Menschen in Arbeit unzufrieden!“ – Karl Marx',
    teaser:
      'Nach einer Studie der Website für Job-Beratung karriere.de sind 25 % der Menschen in ihrer Arbeit unzufrieden – Tendenz steigend.',
    body: [
      'Dies wird mit einem Mangel an Respekt, Wertschätzung und Individualität begründet, da die Arbeiter keine Erfüllung ihrer Wünsche und Forderungen finden und das Verhältnis zu ihren Kollegen besorgt betrachten.',
      'Dies entspricht den Ursachen für die Entfremdung der Arbeit von Karl Marx.',
      'Die Menschen arbeiten vermehrt ohne Spaß und nur zum Zweck, sodass sie keine Erfüllung finden und nur für Dinge außerhalb der Arbeit arbeiten.',
    ],
    image: {
      src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80',
      alt: 'Symbolbild: unzufriedene Arbeitnehmer im Büro',
    },
    sourceUrl:
      'https://karriere.de/meine-inspiration/stimmung-am-arbeitsplatz-wie-zufrieden-arbeitnehmer-wirklich-sind/',
  },
  {
    id: HERO_ARTICLE_ID,
    philosopher: 'marx',
    kicker: 'Aktuelles · Karl Marx',
    title: '„Flughafen liegt lahm – Warnstreiks im Frühjahr 2025“',
    teaser:
      'Zwischen März und Mai waren viele Flughäfen, aber auch andere öffentliche Bereiche und Einrichtungen von Warnstreiks betroffen.',
    heroLead:
      'Zwischen März und Mai waren viele Flughäfen, aber auch andere öffentliche Bereiche und Einrichtungen von Warnstreiks betroffen.',
    body: [
      'Es wurden nach ver.di „[…] bessere Arbeitsbedingungen, mehr Freizeit und eine angemessene Bezahlung für alle Beschäftigten im öffentlichen Dienst von Bund und Kommunen [gefordert]. Dazu gehören auch wir – Tausende Kolleg*innen, die tagtäglich den Luftverkehr am Laufen halten.“',
      'Dies zeigt Karl Marx´ Entfremdung und die Ausbeutung im Kapitalismus.',
      'Die Menschen fordern bessere Arbeitsbedingungen, da diese nicht vom Arbeitgeber, dem Kapitalisten, beachtet werden.',
    ],
    image: {
      src: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=80',
      alt: 'Symbolbild: Demonstrierende Beschäftigte am Flughafen',
    },
    sourceUrl: 'https://www.verdi.de/themen/geld-tarif/++co++eccde3d4-fa8c-11ef-af3c-292fae8c70b0',
  },
  {
    id: 'plessner-1',
    philosopher: 'plessner',
    kicker: 'Aktuelles · Helmuth Pleßner',
    title: '„Social Media verzerrt Selbstbild“',
    teaser:
      'Durch den massiven Zuwachs der Social-Media-Nutzung nehmen immer mehr (junge) Menschen Fotos und Videos von sich auf.',
    body: [
      'Dabei machen sie sich dauerhaft Gedanken darüber, wie das Bild bei anderen ankommen könnte, wie kommentiert wird und ob anderen der Beitrag gefällt.',
      'Sie reflektieren sich also, wie Pleßner sagt, von außen und können danach handeln, indem sie zum Beispiel Filter oder andere Veränderungen aufsetzten, um das Bild und damit die Wahrnehmung zu verzerren.',
      'Sie reflektieren sich, hinterfragen das Handeln anderer und planen dabei die Zukunft, da sie bestimmte Reaktionen erwarten.',
      'Damit entsprechen sie der „exzentrischen Positionalität“ von Pleßner.',
    ],
    image: {
      src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80',
      alt: 'Symbolbild: Jugendliche mit Smartphone und Social-Media-App',
    },
  },
  {
    id: 'plessner-2',
    philosopher: 'plessner',
    kicker: 'Aktuelles · Helmuth Pleßner',
    title: '„Emotionales Konzert“',
    teaser:
      'Ein Musiker ist ein Mensch und hat nach Pleßner einen Innen- und einen Außenaspekt.',
    body: [
      'Wenn er Gitarre spielt und singt, fühlt er die Emotionen und sich als Person, wie er dabei empfindet.',
      'Er betrachtet sich jedoch gleichzeitig von außen, indem er reflektiert, wie er auf die Zuschauer wirkt und ob er richtig spielt.',
      'Daraus bildet sich das Ich, also das Wesen des Musikers.',
      'Die Menschen jubeln, sodass der Musiker daraus schließen kann, dass den Menschen das Lied gefällt.',
    ],
    image: {
      src: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1600&q=80',
      alt: 'Symbolbild: Gitarrist auf einer Bühne',
    },
  },
  {
    id: 'gehlen-1',
    philosopher: 'gehlen',
    kicker: 'Aktuelles · Arnold Gehlen',
    title: '„Sommer 2021 – Zwei Italienerinnen in Alpen erfroren“',
    teaser:
      'Im Sommer 2021 gerieten zwei Italienerinnen in einen Schneesturm in den Alpen.',
    body: [
      'Trotz der Ausrüstung erlitten sie schwere Unterkühlungen und waren nicht in der Lage, ihre Körpertemperatur selbst zu erhöhen.',
      'Die Folge: Kältetod.',
      'Dieses Ereignis unterstützt das Menschenbild von Gehlen, dass der Mensch ein „Mängelwesen“ sei.',
      'Doch ist der äußere Einfluss zu stark, kann auch der künstliche Ausgleich die Mängel nicht kompensieren, was schließlich zum Tod der beiden führte.',
    ],
    image: {
      src: 'https://images.unsplash.com/photo-1445543949571-ffc3e0e2f55e?auto=format&fit=crop&w=1600&q=80',
      alt: 'Symbolbild: Berglandschaft mit Schneesturm / Bergrettung',
    },
    sourceUrl: 'https://www.bergundsteigen.com/artikel/kalt-kaelter-tot/',
  },
  {
    id: 'gehlen-2',
    philosopher: 'gehlen',
    kicker: 'Aktuelles · Arnold Gehlen',
    title: '„Schule ist bedeutende Erziehungseinrichtung“',
    teaser:
      'Die Schule ist eine Institution, die das Leben eines jeden Kindes und Jugendlichen prägt.',
    body: [
      'Nach dem Schulgesetz Berlin solle die Schule Kenntnisse, Fähigkeiten, Fertigkeiten und Werthaltungen vermitteln.',
      'Dadurch vereinfacht sie es den Kindern und Jugendlichen, die Herausforderungen des sozialen und kulturellen Lebens zu meistern.',
      'Sie lehrt den Menschen Verhaltensweisen und Fähigkeiten, die er braucht, um seine Mängel zu kompensieren.',
      'Diese Funktion einer Institution ist nach Gehlen der entscheidende Faktor für den Ausgleich der Mängel und Instinktarmut.',
      'Zum Beispiel werden Dinge wie Hilfsbereitschaft, Zielstrebigkeit, aber auch Interaktion mit anderen trainiert.',
    ],
    image: {
      src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=80',
      alt: 'Symbolbild: Klassenzimmer mit Schülerinnen und Schülern',
    },
    sourceUrl:
      'https://www.schulgesetz-berlin.de/berlin/schulgesetz/teil-i-auftrag-der-schule-und-recht-auf-bildung-und-erziehung-anwendungsbereich/sect-3-bildungs--und-erziehungsziele.php',
  },
  {
    id: 'loewith-1',
    philosopher: 'loewith',
    kicker: 'Aktuelles · Karl Löwith',
    title: '„Fridays for Future kämpft gegen den Klimawandel“',
    teaser:
      'Der Mensch verändert seine Umwelt seit seiner Existenz.',
    body: [
      'Durch die zunehmende Entwicklung der Technologien und der großen Bedeutung von KI, muss der Mensch Platz schaffen, um zum Beispiel Rechenzentren zu errichten oder die Industrie und Wirtschaft auszubauen.',
      'Hier wird deutlich, dass der Mensch ein reines Kulturwesen ist.',
      'Viele Menschen versuchen, zwischen der Entfremdung von der Natur und den Folgen davon eine Balance zu finden und handeln deshalb bei Demonstrationen wie Fridays for Future.',
      'Zusammenfassend ist der Mensch immer noch den Naturgesetzen ausgeliefert und somit selbst vom Klimawandel direkt betroffen.',
    ],
    image: {
      src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
      alt: 'Symbolbild: Klimademonstration mit Plakaten',
    },
  },
  {
    id: 'loewith-2',
    philosopher: 'loewith',
    kicker: 'Aktuelles · Karl Löwith',
    title: '„Massentierhaltung nimmt weiter zu“',
    teaser:
      'Während Tiere Instinkte haben und jagen gehen, wenn sie das Bedürfnis nach Nahrung haben, hat der Mensch diesen Instinkt und die Möglichkeit zur Jagd ohne Hilfsmittel nicht.',
    body: [
      'Er braucht Kultur, so wie Löwith es behauptet.',
      'Das Jagen zum Beispiel wird ihm dabei von der Kultur übernommen: Es gibt spezielle Einrichtungen für Fleischindustrie (Massentierhaltung), die den Instinktmangel und die körperlichen Mängel des Menschen ausgleichen.',
      'Der Mensch ist also durch die Kultur und deren Bereiche angepasst und kommt nur so an Fleisch.',
    ],
    image: {
      src: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=80',
      alt: 'Symbolbild: Stall mit vielen Tieren / Massentierhaltung',
    },
  },
  {
    id: 'kant-1',
    philosopher: 'kant',
    kicker: 'Aktuelles · Immanuel Kant',
    title: '„Corona Impfstoff – Streit oder Zusammenarbeit?“',
    teaser:
      'Die Debatte um den Corona-Impfstoff in der Pandemie 2020–2023 zeigte, wie stark Konkurrenz und Kooperation ineinandergreifen.',
    body: [
      'Welcher Impfstoff ist der beste? Welcher Impfstoff ist am schnellsten auf dem Markt? Diese Fragen stellten sich viele Menschen, da große Ungewissheit herrschte.',
      'Zum einen arbeiteten die Firmen egoistisch, um Anerkennung zu bekommen – der „ungesellige Geselle“.',
      'Zum anderen waren sie gezwungen, kooperativ Forschungsergebnisse auszutauschen, um das gemeinsame Ziel, die Überwindung der Pandemie, zu erreichen.',
      'Der Mensch arbeitet für sich und braucht doch die Gesellschaft, um Ziele zu erreichen – genau der Zwiespalt, den Kant beschreibt.',
    ],
    image: {
      src: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80',
      alt: 'Symbolbild: Impfstoffproduktion im Labor',
    },
  },
  {
    id: 'kant-2',
    philosopher: 'kant',
    kicker: 'Aktuelles · Immanuel Kant',
    title: '„Ukraine-Krieg“',
    teaser:
      'Der Ukraine-Krieg zeigt den „ungeselligen Gesellen“ in der internationalen Politik.',
    body: [
      'Putin lehnt es ab, sich internationalen Bündnissen bzw. Institutionen unterzuordnen, da es die Macht beeinträchtigen könnte.',
      'Er kommuniziert zudem nur sehr begrenzt mit anderen Staaten und handelt egoistisch, da er nur seine eigene Macht sieht.',
      'Auf der anderen Seite ist Russland auf internationalen Handel angewiesen, was zur Gemeinschaft zwingt.',
      'Trotz des Machtstrebens muss Russland in den internationalen Kontakt treten, um seine Existenz zu sichern.',
    ],
    image: {
      src: 'https://images.unsplash.com/photo-1465447142348-e9952c393450?auto=format&fit=crop&w=1600&q=80',
      alt: 'Symbolbild: internationale Politik und Konflikt',
    },
  },
];

export const MEISTGELESEN: MeistgelesenEntry[] = [
  { articleId: HERO_ARTICLE_ID, label: 'Warnstreiks & Arbeitskampf' },
  { articleId: 'plessner-1', label: 'Selbstbilder online' },
  { articleId: 'gehlen-2', label: 'Institution Schule' },
  { articleId: 'loewith-1', label: 'Klimaprotest' },
  { articleId: 'kant-1', label: 'Kooperation & Impfstoff' },
];

export function getArticleById(id: string): NewsArticle | undefined {
  return NEWS_ARTICLES.find((article) => article.id === id);
}

export function getRelatedArticles(articleId: string, limit = 3): NewsArticle[] {
  return NEWS_ARTICLES.filter((article) => article.id !== articleId).slice(0, limit);
}
