from __future__ import annotations

import uuid

from django.db import models


class QuizResult(models.Model):
    """Speichert eine abgeschlossene Quizrunde für das Leaderboard."""

    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    name = models.CharField(max_length=120)
    correct = models.PositiveIntegerField()
    total = models.PositiveIntegerField()
    time_ms = models.PositiveIntegerField()
    answers = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-correct', 'time_ms', 'created_at']

    def __str__(self) -> str:
        return f'{self.name} {self.correct}/{self.total} ({self.time_ms}ms)'
