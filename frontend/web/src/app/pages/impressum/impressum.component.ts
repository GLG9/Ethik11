import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

type SourceLink = {
  label?: string;
  url: string;
};

type SourceSection = {
  title: string;
  links: SourceLink[];
};

@Component({
  selector: 'app-impressum',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './impressum.component.html',
  styleUrl: './impressum.component.scss',
})
export class ImpressumComponent implements OnInit {

  readonly responsiblePersons = ['Gian Luca Gissy', 'Jasper Junge', 'Noah Kauter', 'Oscar Schulenburg'];

  readonly addressLines = [
    'Kurfürst-Joachim-Friedrich-Gymnasium Wolmirstedt',
    'Schwimmbadstraße 1',
    '39326 Wolmirstedt',
  ];

  readonly sections: SourceSection[] = [
    {
      title: 'Karl Marx',
      links: [
        { url: 'https://blogs.fu-berlin.de/menschenbilder/2017/12/19/karl-marx-und-die-entfremdung-des-menschen/' },
        { url: 'https://www.awo-leipzig-stadt.de/wp-content/uploads/2019/07/Text-9-Marxistisches_Menschenbild_versus_christliche_Sozialethik_als_Basis_stationaerer_Altenpflege.pdf' },
        { url: 'https://www.verfassungsschutz.bayern.de/linksextremismus/definition/ideologie/marxismus/index.html' },
        { url: 'https://www.marxists.org/deutsch/archiv/marx-engels/1844/oek-phil/1-4_frem.htm?utm' },
        { url: 'https://linkswende.org/entfremdung-im-kapitalismus/' },
        { url: 'https://www.spektrum.de/lexikon/philosophie/gattungswesen/756' },
        { url: 'https://rundblick-niedersachsen.de/pro-contra-sind-die-lehren-von-karl-marx-heute-noch-relevant' },
        { url: 'https://www.uni-erfurt.de/forschung/aktuelles/forschungsblog-wortmelder/arbeitswelten-der-zukunft-2-pd-dr-christoph-henning' },
        { url: 'https://www.nachhaltigejobs.de/sinnerfuellung-im-job-finden/m' },
        { url: 'https://www.compeon.de/glossar/kapitalismus/' },
      ],
    },
    {
      title: 'Arnold Gehlen',
      links: [
        { url: 'https://knowunity.de/knows/ethik-naturzustand-des-menschens-maengelwesen-arnold-gehlen-f814340d-a78c-4577-977b-c9c7a34102c9' },
        { url: 'https://opus4.kobv.de/opus4-Fromm/frontdoor/deliver/index/docId/4914/file/Barheier_K_1983-1.pdf' },
        { url: 'https://de.wikipedia.org/wiki/M%C3%A4ngelwesen' },
        { url: 'https://de.wikipedia.org/wiki/Arnold_Gehlen?utm' },
        { url: 'https://www.econstor.eu/bitstream/10419/44721/1/605022038.pdf?utm' },
        { url: 'https://www.deutschlandfunk.de/philosophie-des-maengelwesens-100.html?utm' },
        { url: 'https://edoc.ub.uni-muenchen.de/15913/1/Beller_Bernhard.pdf?utm' },
        { url: 'https://de.wikipedia.org/wiki/Rechtssystem_%28Soziologie%29?utm' },
        { url: 'https://www.bug-nrw.de/arbeitsfelder/gute-gesunde-schule/praxis/schule-als-organisation' },
        { url: 'https://www.bpb.de/themen/politisches-system/deutsche-demokratie/39388/funktionen-des-rechts/' },
      ],
    },
    {
      title: 'Karl Löwith',
      links: [
        { label: 'Gestellte Materialien/Schaubilder', url: 'https://quizlet.com/de/karteikarten/karl-lowith-kultur-als-ausdruck-der-fahigkeit-des-menschen-zur-distanzierung-anthropologie-philosophieethik-abitur-602408924' },
        { url: 'https://knowunity.de/app/knows/7cecae2e-6e06-40c4-941f-3b37b12d1de6?utm_content=similarKnows' },
      ],
    },
    {
      title: 'Helmuth Pleßner',
      links: [
        { url: 'https://www.mcam-online.de/helmuth-plessner' },
        { url: 'https://de.wikipedia.org/wiki/Exzentrische_Positionalit%C3%A4t' },
        { url: 'https://userpage.fu-berlin.de/miles/jestel.htm' },
        { url: 'https://monarch.qucosa.de/api/qucosa%3A17289/attachment/ATT-0/' },
        { url: 'https://www.getabstract.com/de/zusammenfassung/die-stufen-des-organischen-und-der-mensch/30532' },
        { url: 'https://lutz-architekt-karlsruhe.de/2025/07/11/helmuth-plessner-die-stufen-des-organischen-und-der-mensch-einleitung-in-die-philosophische-anthropologie' },
      ],
    },
    {
      title: 'Immanuel Kant',
      links: [
        { url: 'https://www.merkur-zeitschrift.de/wp-content/themes/merkur/pdf/mr-47-3-246.pdf' },
        { url: 'https://scholarsarchive.byu.edu/cgi/viewcontent.cgi?article=1973&context=sophnf_essay' },
        { url: 'https://lehrerfortbildung-bw.de/u_gewi/ethik/gym/bp2016/fb8/2_freiheit/5_mat/7_zusatz/#:~:text=Den%20Menschen%20eignet%20die%20ungesellige,zu%20trennen%20droht%2C%20verbunden%20ist.' },
        { url: 'https://www.projekt-gutenberg.org/kant/absicht/absicht.html#:~:text=Die%20Vernunft%20in%20einem%20Gesch%C3%B6pfe,kindischen%20Spiels%20verd%C3%A4chtig%20machen%20w%C3%BCrde.' },
        { url: 'https://de.wikipedia.org/wiki/Moral' },
        { url: 'https://www.youtube.com/watch?v=oGMcPsNV2ks&t=472s' },
        { url: 'https://www.fachverband-ethik.de/fileadmin/user_upload/Baden-W%C3%BCrttemberg/dateien/unterrichtsmaterialien/Reader-Kant.pdf' },
        { url: 'https://philocast.net/zusammenfassung-kant-ueber-das-boese' },
        { url: 'https://philosophenstuebchen.wordpress.com/2024/07/13/immanuel-kant-und-der-fortschritt/#:~:text=Allerdings%20bleibt%20die%20Erz%C3%A4hlung%20des,1786/1913:%2049).&text=Dabei%20k%C3%B6nnen%20auch%20Epochen%2C%20die,(ebd.:%2064).' },
      ],
    },
    {
      title: 'Beispiele & Aktuelles',
      links: [
        { url: 'https://karriere.de/meine-inspiration/stimmung-am-arbeitsplatz-wie-zufrieden-arbeitnehmer-wirklich-sind/' },
        { url: 'https://www.verdi.de/themen/geld-tarif/++co++eccde3d4-fa8c-11ef-af3c-292fae8c70b0' },
        { url: 'https://www.bergundsteigen.com/artikel/kalt-kaelter-tot/' },
        { url: 'https://www.schulgesetz-berlin.de/berlin/schulgesetz/teil-i-auftrag-der-schule-und-recht-auf-bildung-und-erziehung-anwendungsbereich/sect-3-bildungs--und-erziehungsziele.php' },
      ],
    },
    {
      title: 'Steckbriefe',
      links: [
        { url: 'https://de.wikipedia.org/wiki/Helmuth_Plessner' },
        { url: 'https://www.wiesbaden.de/stadtlexikon/stadtlexikon-a-z/plessner-helmuth' },
        { url: 'https://www.dhm.de/lemo/biografie/karl-marx' },
        { url: 'https://agso.uni-graz.at/archive/lexikon/klassiker/gehlen/16bio.htm#' },
        { url: 'https://www.deutsche-biographie.de/gnd118574043.html#ndbcontent' },
        { url: 'https://de.wikipedia.org/wiki/Karl_L%C3%B6with' },
        { url: 'https://studyflix.de/allgemeinwissen/immanuel-kant-5125' },
      ],
    },
    {
      title: 'Bilder & Bildquellen',
      links: [
        { label: 'Bild Karl Marx', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Karl_Marx_by_John_Jabez_Edwin_Mayall_1875_-Restored.png/500px-Karl_Marx_by_John_Jabez_Edwin_Mayall_1875-_Restored.png' },
        { label: 'Website Karl Marx', url: 'https://de.wikipedia.org/wiki/Karl_Marx' },
        { label: 'Bild Immanuel Kant', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Immanuel_Kant_%281724-1804%29_engraving.jpg/960px-Immanuel_Kant_%281724-1804%29_engraving.jpg' },
        { label: 'Website Immanuel Kant', url: 'https://de.wikipedia.org/wiki/Datei:Immanuel_Kant_%281724-1804%29_engraving.jpg' },
        { label: 'Bild Arnold Gehlen', url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEivj8RxkrAgbUlrDu09iZ_RFRdXBVUIa__U5tKw5vn8QJ8aqfujy_Yo8qZrKXxID2rvISU3gSQw-G0nmdbyo454NgZqXnnV-V1GFSecnG3VFl57p-nbXa1uAo2QWEjZfjG2agGCegRUl9g/s200/Arnold+Gehlen+und+die+Kultur+-+Portrait+Gehlen.jpg' },
        { label: 'Website Arnold Gehlen', url: 'http://diepaideia.blogspot.com/2012/06/arnold-gehlen-und-die-kultur.html' },
        { label: 'Bild Karl Löwith', url: 'https://jochenteuffel.com/wp-content/uploads/2023/11/karl-loewith2.jpg' },
        { label: 'Website Karl Löwith', url: 'https://jochenteuffel.com/tag/karl-lowith/' },
        { label: 'Bild Helmuth Pleßner', url: 'https://tu-dresden.de/gsw/phil/iso/hpr/ressourcen/bilder/helmuth-plessner/@@images/9ac5ef1c-3193-4a9b-98c9-574557223b92.jpeg' },
        { label: 'Website Helmuth Pleßner', url: 'https://tu-dresden.de/gsw/phil/iso/hpr/die-professur/prof-dr-fischer/hpg' },
      ],
    },
    {
      title: 'News – Bildquellen',
      links: [
        {
          label: 'News: „Immer mehr Menschen in Arbeit unzufrieden!“',
          url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80',
        },
        {
          label: 'News: „Flughafen liegt Lahm – Warnstreiks im Frühjahr 2025“',
          url:
            'https://images.unsplash.com/photo-1517400508447-f8dd518b86db?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Rmx1Z2hhZmVufGVufDB8fDB8fHww',
        },
        {
          label: 'News: „Social Media verzerrt Selbstbild“',
          url:
            'https://images.unsplash.com/photo-1724862936518-ae7fcfc052c1?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8c29jaWFsJTIwbWVkaWF8ZW58MHx8MHx8fDA%3D',
        },
        {
          label: 'News: „Emotionales Konzert“',
          url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1600&q=80',
        },
        {
          label: 'News: „Sommer 2021 – Zwei Italienerinnen in Alpen erfroren“',
          url: 'https://images.unsplash.com/photo-1445543949571-ffc3e0e2f55e?auto=format&fit=crop&w=1600&q=80',
        },
        {
          label: 'News: „Schule ist bedeutende Erziehungseinrichtung“',
          url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=80',
        },
        {
          label: 'News: „Fridays for Future kämpft gegen den Klimawandel“',
          url:
            'https://images.unsplash.com/photo-1569060368645-4ab30c8d8b0e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8ZnJpZGF5cyUyMGZvciUyMGZ1dHVyZXxlbnwwfHwwfHx8MA%3D%3D',
        },
        {
          label: 'News: „Massentierhaltung nimmt weiter zu“',
          url:
            'https://images.unsplash.com/photo-1545468258-d895ac85938e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fE1hc3NlbnRpZXJoYWx0dW5nfGVufDB8fDB8fHww',
        },
        {
          label: 'News: „Corona Impfstoff – Streit oder Zusammenarbeit?“',
          url:
            'https://images.unsplash.com/photo-1611694449252-02453c27856a?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aW1wZnN0b2ZmfGVufDB8fDB8fHww',
        },
        {
          label: 'News: „Ukraine-Krieg“',
          url:
            'https://images.unsplash.com/photo-1647273426587-31512cdf2e50?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8a3JpZWclMjB1a3JhaW5lfGVufDB8fDB8fHww',
        },
      ],
    },
  ];

  ngOnInit(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}
