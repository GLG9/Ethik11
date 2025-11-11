from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

from django.test import TestCase


class ChatViewTests(TestCase):
    def setUp(self) -> None:
        self.url = '/api/chat/kant/'
        self.payload = {
            'messages': [
                {'role': 'system', 'content': 'Antworte als Kant.'},
                {'role': 'user', 'content': 'Was ist Aufklärung?'},
            ],
        }

    @patch('chat.views.httpx.Client')
    def test_chat_success(self, client_mock: MagicMock) -> None:
        mock_client = MagicMock()
        client_mock.return_value.__enter__.return_value = mock_client
        response_mock = MagicMock()
        response_mock.json.return_value = {
            'choices': [{'message': {'content': 'Hallo!'}}]
        }
        response_mock.raise_for_status.return_value = None
        mock_client.post.return_value = response_mock

        response = self.client.post(
            self.url,
            data=json.dumps(self.payload),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('reply', data)
        self.assertEqual(data['reply'], 'Hallo!')

    def test_unknown_model_returns_404(self) -> None:
        response = self.client.post(
            '/api/chat/unbekannt/',
            data=json.dumps(self.payload),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 404)
