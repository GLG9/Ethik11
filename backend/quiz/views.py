from __future__ import annotations

from typing import Any, Sequence

from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .data import (
    ANSWER_KEY,
    LIVE_QUESTION_COUNT,
    PLANNED_TOTAL,
    QUESTIONS,
    QUESTION_INDEX,
    UPCOMING_COUNT,
    Choice,
    Question,
    normalise_answers,
)
from .models import QuizResult

PLACEHOLDER_IDS = tuple(f'q{idx}' for idx in range(LIVE_QUESTION_COUNT + 1, PLANNED_TOTAL + 1))


def serialize_choice(choice: Choice) -> dict[str, str]:
    return {'id': choice.id, 'text': choice.text}


def serialize_question(question: Question) -> dict[str, Any]:
    return {
        'id': question.id,
        'topic': question.topic,
        'prompt': question.prompt,
        'multi': question.multi,
        'choices': [serialize_choice(choice) for choice in question.choices],
    }


def serialize_result(result: QuizResult, rank: int) -> dict[str, Any]:
    return {
        'id': str(result.uuid),
        'name': result.name,
        'correct': result.correct,
        'total': result.total,
        'timeMs': result.time_ms,
        'rank': rank,
        'createdAt': timezone.localtime(result.created_at).isoformat(),
    }


def build_leaderboard(limit: int | None = None) -> list[dict[str, Any]]:
    results: Sequence[QuizResult] = list(
        QuizResult.objects.order_by('-correct', 'time_ms', 'created_at')
    )
    entries: list[dict[str, Any]] = []
    for index, result in enumerate(results, start=1):
        if limit is not None and index > limit:
            break
        entries.append(serialize_result(result, index))
    return entries


class QuizViewSet(viewsets.ViewSet):
    """REST-Endpoints für Quizfragen, Ergebnisse und Leaderboard."""

    metadata = {
        'plannedTotal': PLANNED_TOTAL,
        'activeTotal': LIVE_QUESTION_COUNT,
        'upcomingTotal': UPCOMING_COUNT,
        'placeholders': [
            {'id': placeholder_id, 'label': f'Frage {placeholder_id[1:]}', 'status': 'coming_soon'}
            for placeholder_id in PLACEHOLDER_IDS
        ],
    }

    def list(self, request: Request) -> Response:
        """Return general quiz metadata (health check endpoint)."""
        return Response(self.metadata, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='questions')
    def questions(self, _: Request) -> Response:
        return Response(
            data={
                'metadata': self.metadata,
                'items': [serialize_question(q) for q in QUESTIONS],
                'message': '15 geplant – 7 in Arbeit',
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def _validate_answers(raw_answers: Any) -> dict[str, list[str]]:
        if not isinstance(raw_answers, dict):
            raise ValidationError('answers must be an object with question-id keys.')
        answers = normalise_answers(raw_answers)
        for question_id, selections in answers.items():
            if question_id not in QUESTION_INDEX:
                raise ValidationError(f'Unknown question id: {question_id}')
            question = QUESTION_INDEX[question_id]
            allowed = {choice.id for choice in question.choices}
            if not set(selections).issubset(allowed):
                raise ValidationError(f'Invalid answer option for {question_id}.')
            if not selections:
                raise ValidationError(f'Please choose at least one answer for {question_id}.')
            if not question.multi and len(selections) != 1:
                raise ValidationError(f'{question_id} expects exactly one answer.')
        missing_questions = [
            question.id for question in QUESTIONS if not answers.get(question.id)
        ]
        if missing_questions:
            raise ValidationError(
                'Bitte beantworte alle Fragen: ' + ', '.join(missing_questions)
            )
        return answers

    @staticmethod
    def _validate_name(raw_name: Any) -> str:
        if not isinstance(raw_name, str):
            raise ValidationError('name must be a string.')
        name = raw_name.strip()
        if not name:
            raise ValidationError('Name fehlt.')
        if len(name) > 120:
            raise ValidationError('Name ist zu lang (max. 120 Zeichen).')
        return name

    @staticmethod
    def _validate_time_ms(raw_time_ms: Any) -> int:
        if not isinstance(raw_time_ms, int):
            raise ValidationError('timeMs must be an integer.')
        if raw_time_ms <= 0:
            raise ValidationError('timeMs must be greater than zero.')
        return raw_time_ms

    @action(detail=False, methods=['post'], url_path='submit')
    def submit(self, request: Request) -> Response:
        payload = request.data or {}
        try:
            name = self._validate_name(payload.get('name'))
            answers = self._validate_answers(payload.get('answers', {}))
            time_ms = self._validate_time_ms(payload.get('timeMs'))
        except ValidationError as exc:
            return Response({'detail': exc.detail}, status=status.HTTP_400_BAD_REQUEST)

        correct = 0
        evaluated_answers: dict[str, list[str]] = {}
        for question in QUESTIONS:
            selections = answers.get(question.id, [])
            evaluated_answers[question.id] = selections
            if ANSWER_KEY.is_correct(question.id, selections):
                correct += 1

        with transaction.atomic():
            result = QuizResult.objects.create(
                name=name,
                correct=correct,
                total=LIVE_QUESTION_COUNT,
                time_ms=time_ms,
                answers=evaluated_answers,
            )

        all_results = list(QuizResult.objects.order_by('-correct', 'time_ms', 'created_at'))
        rank_lookup = {res.uuid: index for index, res in enumerate(all_results, start=1)}
        rank = rank_lookup[result.uuid]

        return Response(
            data={
                'metadata': self.metadata,
                'result': serialize_result(result, rank),
                'leaderboard': [
                    serialize_result(res, idx)
                    for idx, res in enumerate(all_results[:10], start=1)
                ],
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='leaderboard')
    def leaderboard(self, request: Request) -> Response:
        limit_param = request.query_params.get('limit')
        limit: int | None = None
        if limit_param:
            try:
                limit_val = int(limit_param)
                if limit_val > 0:
                    limit = min(limit_val, 100)
            except ValueError:
                pass
        entries = build_leaderboard(limit)
        return Response(
            data={'metadata': self.metadata, 'entries': entries},
            status=status.HTTP_200_OK,
        )

    @leaderboard.mapping.delete
    def clear_leaderboard(self, _: Request) -> Response:
        QuizResult.objects.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
