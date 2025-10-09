from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

from chat.views import chat_stream
from quiz.api import router as quiz_router


def root_view(_request):
    """Einfache Status-Antwort für die Startseite."""
    return JsonResponse({
        'message': 'Ethik-Backend läuft. APIs unter /api/ verfügbar.',
        'endpoints': {
            'chat': '/api/chat/<persona>/',
            'quiz': '/api/quiz/',
        },
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', root_view, name='root'),
    path('api/chat/<str:who>/', chat_stream, name='chat-stream'),
    path('api/quiz/', include(quiz_router.urls)),
]
