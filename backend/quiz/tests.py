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
        self.assertTrue(response.data['storage']['stored'])
        self.assertEqual(response.data['storage']['highlightId'], result['id'])
        self.assertIn('review', response.data)
        self.assertEqual(len(response.data['review']), LIVE_QUESTION_COUNT)
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

    def test_second_attempt_not_saved_but_returns_result(self) -> None:
        first_response = self.client.post('/api/quiz/submit/', self._full_score_payload('Ivy', 62000), format='json')
        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(QuizResult.objects.count(), 1)
        first_id = first_response.data['result']['id']

        second_payload = self._full_score_payload('Ivy', 48000)
        second_payload['answers']['q1'] = ['A']  # drop score to ensure different outcome
        second_response = self.client.post('/api/quiz/submit/', second_payload, format='json')
        self.assertEqual(second_response.status_code, 200, second_response.data)
        self.assertFalse(second_response.data['storage']['stored'])
        self.assertEqual(second_response.data['storage']['highlightId'], first_id)
        self.assertIsNone(second_response.data['result']['id'])
        self.assertIsNone(second_response.data['result']['rank'])
        self.assertIn('review', second_response.data)
        self.assertEqual(len(second_response.data['review']), LIVE_QUESTION_COUNT)
        self.assertEqual(QuizResult.objects.count(), 1)

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

    def test_delete_single_entry(self) -> None:
        response = self.client.post('/api/quiz/submit/', self._full_score_payload('Fiona', 50000), format='json')
        entry_id = response.data['result']['id']
        self.assertEqual(QuizResult.objects.count(), 1)

        delete_response = self.client.delete(f'/api/quiz/leaderboard/{entry_id}/')
        self.assertEqual(delete_response.status_code, 204)
        self.assertEqual(QuizResult.objects.count(), 0)

        missing_response = self.client.delete(f'/api/quiz/leaderboard/{entry_id}/')
        self.assertEqual(missing_response.status_code, 404)

    def test_review_endpoint_returns_questions(self) -> None:
        response = self.client.post('/api/quiz/submit/', self._full_score_payload('Gina', 55000), format='json')
        entry_id = response.data['result']['id']

        review = self.client.get(f'/api/quiz/leaderboard/{entry_id}/')
        self.assertEqual(review.status_code, 200, review.data)
        payload = review.data
        self.assertIn('questions', payload)
        self.assertEqual(len(payload['questions']), LIVE_QUESTION_COUNT)
        first_question = payload['questions'][0]
        self.assertIn('choices', first_question)
        self.assertTrue(any(choice['correct'] for choice in first_question['choices']))
