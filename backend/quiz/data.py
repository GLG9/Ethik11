from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Choice:
    id: str
    text: str


@dataclass(frozen=True, slots=True)
class Question:
    id: str
    topic: str
    prompt: str
    multi: bool
    choices: tuple[Choice, ...]
    correct_ids: tuple[str, ...]


QUESTIONS: tuple[Question, ...] = (
    Question(
        id='q1',
        topic='Marx',
        prompt="Was beschreibt Marx' Verständnis von Arbeit in seinem Menschenbild?",
        multi=True,
        choices=(
            Choice(id='A', text='Arbeit ist eine Form der Selbstverwirklichung des Menschen.'),
            Choice(id='B', text='Arbeit dient ausschließlich dem materiellen Überleben.'),
            Choice(id='C', text='Arbeit ist Ausdruck der Freiheit und Kreativität.'),
            Choice(id='D', text='Arbeit ist immer ein Mittel zur Ausbeutung.'),
        ),
        correct_ids=('A', 'C'),
    ),
    Question(
        id='q2',
        topic='Marx',
        prompt='Inwiefern führt der Kapitalismus laut Marx zur Entfremdung des Menschen?',
        multi=True,
        choices=(
            Choice(id='A', text='Der Mensch verliert die Kontrolle über den Produktionsprozess.'),
            Choice(id='B', text='Der Mensch arbeitet nur noch, um äußere Bedürfnisse zu erfüllen.'),
            Choice(id='C', text='Der Kapitalismus fördert die natürliche Produktivität des Menschen.'),
            Choice(id='D', text='Der Mensch entfremdet sich sowohl von sich selbst als auch von anderen.'),
        ),
        correct_ids=('A', 'B', 'D'),
    ),
    Question(
        id='q3',
        topic='Marx',
        prompt='Welche Eigenschaften hat das „Gattungswesen“ Mensch bei Marx?',
        multi=True,
        choices=(
            Choice(id='A', text='Er ist von Natur aus auf Gemeinschaft angewiesen.'),
            Choice(id='B', text='Er ist instinktgesteuert und triebhaft.'),
            Choice(id='C', text='Er verwirklicht sich durch bewusste, schöpferische Tätigkeit.'),
            Choice(id='D', text='Er kann nur im Sozialismus seine wahre Natur entfalten.'),
        ),
        correct_ids=('A', 'C', 'D'),
    ),
    Question(
        id='q4',
        topic='Plessner',
        prompt='Was bedeutet Plessners Begriff der „exzentrischen Positionalität“ für das Selbstverständnis des Menschen?',
        multi=True,
        choices=(
            Choice(id='A', text='Der Mensch kann seine eigene Existenz reflektieren.'),
            Choice(id='B', text='Der Mensch hat eine Doppelnatur, einen Innen- und Außenaspekt.'),
            Choice(id='C', text='Der Mensch ist durch seine Instinkte vollständig bestimmt.'),
            Choice(id='D', text='Der Mensch kann seine Perspektive verändern und sich selbst von außen wahrnehmen.'),
        ),
        correct_ids=('A', 'B', 'D'),
    ),
    Question(
        id='q5',
        topic='Plessner',
        prompt='Welche Folgen hat laut Plessner die Fähigkeit des Menschen zur Selbstreflexion?',
        multi=True,
        choices=(
            Choice(id='A', text='Sie ermöglicht Kultur und Selbstbewusstsein.'),
            Choice(id='B', text='Sie führt zu inneren Spannungen und Selbstzweifeln.'),
            Choice(id='C', text='Sie verhindert moralisches Handeln.'),
            Choice(id='D', text='Sie löst den Menschen vollständig von der Natur.'),
        ),
        correct_ids=('A', 'B'),
    ),
    Question(
        id='q6',
        topic='Plessner',
        prompt='Was meint Plessner mit „natürlicher Künstlichkeit“?',
        multi=True,
        choices=(
            Choice(id='A', text='Der Mensch entfernt sich durch seine kulturellen Handlungen von der Natur.'),
            Choice(id='B', text='Die Schaffung von Kultur entspricht der Natur des Menschen.'),
            Choice(id='C', text='Der Mensch lebt rein instinktiv und ohne kulturelle Prägung.'),
            Choice(id='D', text='Der Mensch wird erst durch Künstlichkeit zum Menschen.'),
        ),
        correct_ids=('A', 'B', 'D'),
    ),
    Question(
        id='q7',
        topic='Löwith',
        prompt='Welche Aussagen treffen auf Löwiths Verständnis des Menschen als Kulturwesen zu?',
        multi=True,
        choices=(
            Choice(id='A', text='Der Mensch ist gezwungen, Kultur zu schaffen, da er keine Instinkte besitzt.'),
            Choice(id='B', text='Kultur ist eine Abweichung von der Natur, aber für den Menschen natürlich.'),
            Choice(id='C', text='Durch Kultur distanziert sich der Mensch von der Natur.'),
            Choice(id='D', text='Kultur gleicht die natürlichen Defizite des Menschen aus.'),
        ),
        correct_ids=('A', 'B', 'C', 'D'),
    ),
    Question(
        id='q8',
        topic='Löwith',
        prompt='Wie versteht Löwith die „Distanzierung von der Natur“?',
        multi=True,
        choices=(
            Choice(id='A', text='Der Mensch erkennt die Natur als etwas Äußeres und kann sie dadurch gestalten.'),
            Choice(id='B', text='Der Mensch verliert jede Verbindung zur Natur.'),
            Choice(id='C', text='Die Distanz ermöglicht Erkenntnis und Verantwortung.'),
            Choice(id='D', text='Sie bedeutet, dass der Mensch nicht mehr Teil der Naturgesetze ist.'),
        ),
        correct_ids=('A', 'C'),
    ),
    Question(
        id='q9',
        topic='Löwith',
        prompt='Was bedeutet Löwiths Satz „Das Künstliche ist dem Menschen natürlich“?',
        multi=True,
        choices=(
            Choice(id='A', text='Es liegt in der menschlichen Natur, Kultur und Technik hervorzubringen.'),
            Choice(id='B', text='Künstlichkeit widerspricht der menschlichen Natur.'),
            Choice(id='C', text='Der Mensch kann seine Natürlichkeit nur durch kulturelles Handeln ausdrücken.'),
            Choice(id='D', text='Künstlichkeit ist ein Zeichen für die Entfremdung des Menschen.'),
        ),
        correct_ids=('A', 'C', 'D'),
    ),
    Question(
        id='q10',
        topic='Gehlen',
        prompt='Warum bezeichnet Gehlen den Menschen als „Mängelwesen“?',
        multi=True,
        choices=(
            Choice(id='A', text='Weil ihm angeborene Instinkte fehlen.'),
            Choice(id='B', text='Weil er körperlich nicht an die Umwelt angepasst ist.'),
            Choice(id='C', text='Weil er überdurchschnittlich lernfähig ist.'),
            Choice(id='D', text='Weil er nur durch Kultur überleben kann.'),
        ),
        correct_ids=('A', 'B', 'D'),
    ),
    Question(
        id='q11',
        topic='Gehlen',
        prompt='Welche Funktion erfüllen laut Gehlen Institutionen?',
        multi=True,
        choices=(
            Choice(id='A', text='Sie kompensieren die Instinktschwäche des Menschen.'),
            Choice(id='B', text='Sie begrenzen die Freiheit, um Sicherheit zu schaffen.'),
            Choice(id='C', text='Sie verhindern jede Form sozialer Verantwortung.'),
            Choice(id='D', text='Sie geben Orientierung und Stabilität im Zusammenleben.'),
        ),
        correct_ids=('A', 'B', 'D'),
    ),
    Question(
        id='q12',
        topic='Gehlen',
        prompt='Wie hängen Kultur, Freiheit und Verantwortung bei Gehlen zusammen?',
        multi=True,
        choices=(
            Choice(id='A', text='Freiheit entsteht durch die Abwesenheit von Regeln.'),
            Choice(id='B', text='Kultur ermöglicht Orientierung, damit Freiheit sinnvoll genutzt werden kann.'),
            Choice(id='C', text='Verantwortung ergibt sich daraus, dass der Mensch frei handeln kann.'),
            Choice(id='D', text='Ohne Kultur wäre die Freiheit des Menschen chaotisch und zerstörerisch.'),
        ),
        correct_ids=('B', 'C', 'D'),
    ),
    Question(
        id='q13',
        topic='Kant',
        prompt='Was drückt der Antagonismus aus?',
        multi=True,
        choices=(
            Choice(id='A', text='Der Mensch steht im Zwiespalt zwischen sich und der Gesellschaft.'),
            Choice(id='B', text='Der Mensch steht vollkommen gegen die Gesellschaft und folgt seinen Trieben.'),
            Choice(id='C', text='Die Gesellschaft ist egoistisch, sodass sich der Mensch nicht in ihr einfinden kann.'),
            Choice(id='D', text='Der Mensch ist bedingt egoistisch, braucht aber eine Gesellschaft, um Mensch zu sein.'),
        ),
        correct_ids=('A', 'D'),
    ),
    Question(
        id='q14',
        topic='Kant',
        prompt='Welche Folgen hat der Antagonismus?',
        multi=True,
        choices=(
            Choice(id='A', text='Er lässt den Menschen pessimistisch und isoliert werden.'),
            Choice(id='B', text='Er ist der Antrieb der Forschung und Ideenfindung.'),
            Choice(id='C', text='Die „unendliche“ Entwicklung der Gesellschaft.'),
            Choice(id='D', text='Kriege und der Drang nach Machtausbreitung.'),
        ),
        correct_ids=('B', 'C', 'D'),
    ),
    Question(
        id='q15',
        topic='Kant',
        prompt='Welche Lösungen bietet Kant für die Probleme des „ungeselligen Gesellen“?',
        multi=True,
        choices=(
            Choice(id='A', text='Der Mensch muss seinen Egoismus vollständig abstellen.'),
            Choice(id='B', text='Ein Weltbürgertum, wo jede Person das Gute für die Welt sieht.'),
            Choice(id='C', text='Das Recht als Grenze für Willkür.'),
            Choice(id='D', text='Ein Diktator, der alles vorschreibt, um den Erfinderdrang zu unterdrücken.'),
        ),
        correct_ids=('B', 'C'),
    ),
)

PLANNED_TOTAL: int = 15
LIVE_QUESTION_COUNT: int = len(QUESTIONS)
UPCOMING_COUNT: int = PLANNED_TOTAL - LIVE_QUESTION_COUNT


class AnswerKey(dict[str, tuple[str, ...]]):
    """Answer lookup with helper methods."""

    def is_correct(self, question_id: str, selected_ids: list[str]) -> bool:
        expected = set(self.get(question_id, ()))
        provided = set(selected_ids)
        return bool(expected) and provided == expected


ANSWER_KEY: AnswerKey = AnswerKey(
    (question.id, question.correct_ids) for question in QUESTIONS
)


QUESTION_INDEX: dict[str, Question] = {question.id: question for question in QUESTIONS}


def normalise_answers(payload: dict[str, list[str]] | dict[str, tuple[str, ...]]) -> dict[str, list[str]]:
    """Ensure answers are lists of unique, uppercase option identifiers."""
    normalised: dict[str, list[str]] = {}
    for question_id, selection in payload.items():
        seen: set[str] = set()
        cleaned: list[str] = []
        for value in selection:
            candidate = str(value).strip().upper()
            if candidate and candidate not in seen:
                seen.add(candidate)
                cleaned.append(candidate)
        normalised[question_id] = cleaned
    return normalised
