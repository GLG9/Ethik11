from rest_framework.routers import DefaultRouter

from .views import QuizViewSet

router = DefaultRouter()
router.register('', QuizViewSet, basename='quiz')

__all__ = ['router']
