from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from reconcile.views import (
    LoginView,
    current_user,
    organization_reconciliation
)

urlpatterns = [

    path(
        "login/",
        LoginView.as_view(),
        name="login"
    ),

    path(
        "me/",
        current_user,
        name="current-user"
    ),

    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh"
    ),

    path(
        "reconcile/<str:org_id>/",
        organization_reconciliation,
        name="organization-reconciliation"
    ),

]