from django.contrib.auth import authenticate
from django.http import JsonResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from reconcile.models import UserOrganization
from reconcile.services import reconcile_records


# USER LOGIN
class LoginView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"error": "Username and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(
            username=username,
            password=password
        )

        if user is None:
            return Response(
                {"error": "Invalid username or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {"error": "Account is inactive"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            organization = user.organization
        except UserOrganization.DoesNotExist:
            return Response(
                {"error": "No organization assigned to this account"},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "Login successful",
            "username": user.username,
            "organization": organization.org_id,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })


# CURRENT USER DETAILS
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):

    try:
        organization = request.user.organization

        return Response({
            "username": request.user.username,
            "organization": organization.org_id
        })

    except UserOrganization.DoesNotExist:

        return Response(
            {"error": "No organization assigned"},
            status=status.HTTP_403_FORBIDDEN
        )


# ORGANIZATION RECONCILIATION
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def organization_reconciliation(request, org_id):

    try:
        organization = request.user.organization

    except UserOrganization.DoesNotExist:

        return Response(
            {"error": "No organization assigned to this account"},
            status=status.HTTP_403_FORBIDDEN
        )

    # SECURITY CHECK
    if organization.org_id != org_id:

        return Response(
            {"error": "You are not authorized to access this organization"},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        result = reconcile_records(organization.org_id)

        return Response(result)

    except Exception:
        return Response(
            {"error": "Unable to process reconciliation"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )