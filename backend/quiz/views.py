from collections.abc import Iterable
from typing import Any

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

DUMMY_QUESTIONS = [
    {
        'id': 1,
        'philosopher': 'kant',
        'question': 'Wie lautet die Leitfrage der kantischen Ethik?',
        'choices': [
            'Was ist der kategorische Imperativ?',
            'Wie kann der Mensch glücklich werden?',
            'Welche Tugenden sind besonders wichtig?',
        ],
        'correctIndex': 0,
    },
    {
        'id': 2,
        'philosopher': 'marx',
        'question': 'Wogegen richtet sich Marx’ Kritik der politischen Ökonomie?',
        'choices': [
            'Gegen den Liberalismus',
            'Gegen die Entfremdung durch Lohnarbeit',
            'Gegen religiöse Dogmen',
        ],
        'correctIndex': 1,
    },
]

DUMMY_LEADERBOARD = [
    {'position': 1, 'user': 'Anna', 'score': 5},
    {'position': 2, 'user': 'Ben', 'score': 4},
    {'position': 3, 'user': 'Gast', 'score': 3},
]


class QuizViewSet(viewsets.ViewSet):
    """DRF ViewSet mit Dummy-Antworten für Phase 1."""

    @staticmethod
    def _filter_questions(who: str | None) -> Iterable[dict[str, Any]]:
        if not who:
            return DUMMY_QUESTIONS
        return [q for q in DUMMY_QUESTIONS if q['philosopher'] == who]

    def list(self, request: Request) -> Response:  # pragma: no cover - stub
        return Response({'detail': 'Quiz-API Stub'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='questions')
    def questions(self, request: Request) -> Response:
        who = request.query_params.get('who')
        items = list(self._filter_questions(who))
        return Response({'who': who, 'items': items})

    @action(detail=False, methods=['post'], url_path='submit')
    def submit(self, request: Request) -> Response:
        payload = request.data or {}
        score = payload.get('score', 0)
        return Response({
            'score': score,
            'message': 'Auswertung folgt in Phase 2 (Stub).',
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='leaderboard')
    def leaderboard(self, _: Request) -> Response:
        return Response({'entries': DUMMY_LEADERBOARD})
