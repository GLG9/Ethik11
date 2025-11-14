import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

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
export class ImpressumComponent {
  readonly intro =
    'Wir führen sämtliche Recherchen, Bildnachweise und Beispielquellen transparent. Alle Inhalte dienen der historischen und didaktischen Verortung der Menschenbilder.';

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
  ];
}
