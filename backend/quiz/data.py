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
        topic='Plessner',
        prompt='Welche Aussagen beschreiben die exzentrische Positionalität des Menschen nach Plessner?',
        multi=True,
        choices=(
            Choice(id='A', text='Der Mensch kann sich selbst von außen betrachten.'),
            Choice(id='B', text='Der Mensch ist vollständig instinktgesteuert.'),
            Choice(id='C', text='Der Mensch erlebt sich zugleich als Körper und hat einen Körper.'),
            Choice(id='D', text='Der Mensch ist fest in eine Position eingebettet und kann sie nicht verlassen.'),
        ),
        correct_ids=('A', 'C'),
    ),
    Question(
        id='q2',
        topic='Plessner',
        prompt='Welche der folgenden Aussagen gehören zu Plessners anthropologischen Grundgesetzen?',
        multi=True,
        choices=(
            Choice(id='A', text='Der Mensch hat unmittelbaren Zugang zu sich selbst ohne Vermittlung.'),
            Choice(id='B', text='Der Mensch ist durch natürliche Künstlichkeit gekennzeichnet.'),
            Choice(id='C', text='Der Mensch darf keine utopische Vollendung seines Wesens behaupten.'),
            Choice(id='D', text='Der Mensch lebt ohne kulturelle Gestaltungsmöglichkeiten.'),
        ),
        correct_ids=('B', 'C'),
    ),
    Question(
        id='q3',
        topic='Plessner',
        prompt='Welche Aussagen macht Plessner über die Lebensführung des Menschen?',
        multi=True,
        choices=(
            Choice(id='A', text='Der Mensch muss sein Leben führen, indem er es führt (nicht nur lebt).'),
            Choice(id='B', text='Der Mensch ist auf künstliche Mittel angewiesen, um seine Existenz zu sichern.'),
            Choice(id='C', text='Der Mensch kann sich vollständig in der Natur verwirklichen, ohne Kultur.'),
            Choice(id='D', text='Kultur ist ein notwendiger Bestandteil menschlicher Existenzweise.'),
        ),
        correct_ids=('A', 'B', 'C'),
    ),
    Question(
        id='q4',
        topic='Löwith',
        prompt='Welche Aussagen entsprechen laut Karl Löwith den Gemeinsamkeiten von Mensch und Tier?',
        multi=True,
        choices=(
            Choice(id='A', text='Beide werden auf natürliche Weise geboren.'),
            Choice(id='B', text='Beide besitzen dieselben Grundbedürfnisse wie Essen und Schlaf.'),
            Choice(id='C', text='Der Mensch wird künstlich geboren und hat keine Naturbindung.'),
            Choice(id='D', text='Beide unterliegen natürlichen Gesetzen wie Fortpflanzung und Sexualtrieb.'),
        ),
        correct_ids=('A', 'B', 'D'),
    ),
    Question(
        id='q5',
        topic='Löwith',
        prompt='Welche Aussagen beschreiben laut Löwith den Unterschied im Naturverhältnis von Mensch und Tier?',
        multi=True,
        choices=(
            Choice(id='A', text='Das Tier passt sich seiner Umwelt an und lebt unmittelbar in der Natur.'),
            Choice(id='B', text='Der Mensch ist vollständig abhängig von natürlichen Instinkten.'),
            Choice(id='C', text='Der Mensch distanziert sich von der Natur und gestaltet aktiv seine Umwelt.'),
            Choice(id='D', text='Das Tier gestaltet seine Umwelt durch Kultur und Technik.'),
        ),
        correct_ids=('A', 'C'),
    ),
    Question(
        id='q6',
        topic='Löwith',
        prompt='Welche Aussagen beschreiben laut Löwith das menschliche Erkennen im Unterschied zum tierischen Kennen?',
        multi=True,
        choices=(
            Choice(id='A', text='Der Mensch kann über die Natur hinaus Fragen stellen und reflektieren.'),
            Choice(id='B', text='Das Tier erkennt seine Stellung in der Welt und denkt über Handlungen nach.'),
            Choice(id='C', text='Der Mensch nutzt Erkenntnis als Grundlage für Kultur und Selbstbewusstsein.'),
            Choice(id='D', text='Das Tier handelt aus Instinkt und ist unmittelbar in die Natur eingebunden.'),
        ),
        correct_ids=('A', 'C', 'D'),
    ),
    Question(
        id='q7',
        topic='Marx',
        prompt='Warum empfindet der Arbeiter seine Arbeit laut Marx als „fremd“?',
        multi=True,
        choices=(
            Choice(id='A', text='Weil er nicht selbst entscheidet, was und wie produziert wird; die Arbeit erscheint aufgezwungen.'),
            Choice(id='B', text='Weil er zu wenig mit anderen Menschen zusammenarbeitet.'),
            Choice(id='C', text='Weil die Arbeit körperlich anstrengend und monoton ist.'),
            Choice(id='D', text='Weil er sich über das Ergebnis seiner Arbeit freut.'),
        ),
        correct_ids=('A', 'C'),
    ),
    Question(
        id='q8',
        topic='Marx',
        prompt='In welcher Beziehung stehen die Arbeiter laut Marx zueinander?',
        multi=True,
        choices=(
            Choice(id='A', text='Sie arbeiten immer miteinander und pflegen ein gutes Verhältnis.'),
            Choice(id='B', text='Sie stehen im ständigen Konkurrenzkampf.'),
            Choice(id='C', text='Sie sind misstrauisch und gleichgültig den Mitarbeitenden gegenüber.'),
            Choice(id='D', text='Sie verdienen alle gleich viel Geld und sind den selben Umständen ausgesetzt.'),
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
