from __future__ import annotations

from django.test import TestCase
from rest_framework.test import APIClient

from .data import ANSWER_KEY, LIVE_QUESTION_COUNT, QUESTIONS
from .models import QuizResult


class QuizApiTests(TestCase):
    maxDiff = None

    def setUp(self) -> None:
        self.client = APIClient()

    def _full_score_payload(self, name: str, time_ms: int) -> dict:
        return {
            'name': name,
            'timeMs': time_ms,
            'answers': {question_id: list(correct_ids) for question_id, correct_ids in ANSWER_KEY.items()},
        }

    def test_submit_creates_entry_and_returns_rank(self) -> None:
        response = self.client.post('/api/quiz/submit/', self._full_score_payload('Anna', 60000), format='json')
        self.assertEqual(response.status_code, 200, response.data)
        result = response.data['result']
        self.assertEqual(result['correct'], LIVE_QUESTION_COUNT)
        self.assertEqual(result['rank'], 1)
        self.assertEqual(result['timeMs'], 60000)
        self.assertEqual(QuizResult.objects.count(), 1)

    def test_rank_orders_by_score_then_time_then_created(self) -> None:
        # First entry: full score in 90s
        self.client.post('/api/quiz/submit/', self._full_score_payload('Anna', 90000), format='json')

        # Second entry: lower score should rank behind regardless of time
        partial_answers = self._full_score_payload('Ben', 30000)
        partial_answers['answers']['q1'] = ['A']  # remove one correct answer to drop score
        response_partial = self.client.post('/api/quiz/submit/', partial_answers, format='json')
        self.assertEqual(response_partial.status_code, 200)
        self.assertEqual(response_partial.data['result']['correct'], LIVE_QUESTION_COUNT - 1)
        self.assertEqual(response_partial.data['result']['rank'], 2)

        # Third entry: full score but faster time should take rank 1
        response_fast = self.client.post('/api/quiz/submit/', self._full_score_payload('Chris', 45000), format='json')
        self.assertEqual(response_fast.status_code, 200)
        self.assertEqual(response_fast.data['result']['rank'], 1)

        leaderboard = self.client.get('/api/quiz/leaderboard/').data['entries']
        self.assertEqual([entry['name'] for entry in leaderboard[:3]], ['Chris', 'Anna', 'Ben'])

    def test_validation_errors(self) -> None:
        response = self.client.post('/api/quiz/submit/', {'name': '', 'timeMs': -5, 'answers': {}}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('detail', response.data)

        invalid_answers = self._full_score_payload('Dana', 1000)
        invalid_answers['answers']['q1'] = ['Z']  # invalid option
        response_invalid = self.client.post('/api/quiz/submit/', invalid_answers, format='json')
        self.assertEqual(response_invalid.status_code, 400)

    def test_clear_leaderboard(self) -> None:
        self.client.post('/api/quiz/submit/', self._full_score_payload('Eli', 70000), format='json')
        self.assertEqual(QuizResult.objects.count(), 1)
        response_clear = self.client.delete('/api/quiz/leaderboard/')
        self.assertEqual(response_clear.status_code, 204)
        self.assertEqual(QuizResult.objects.count(), 0)
