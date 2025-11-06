from django.contrib import admin

from .models import QuizResult


@admin.register(QuizResult)
class QuizResultAdmin(admin.ModelAdmin):
    list_display = ('name', 'correct', 'total', 'time_ms', 'created_at')
    list_filter = ('correct', 'created_at')
    search_fields = ('name',)
    ordering = ('-correct', 'time_ms', 'created_at')
