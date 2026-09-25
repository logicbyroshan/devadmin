from rest_framework import viewsets, permissions
from .models import Category
from .serializers import CategorySerializer

class CategoryViewSet(viewsets.ModelViewSet):
    """
    Categories Taxonomy API.
    Supports filtering by ?type=project|skill|experience|achievement
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        cat_type = self.request.query_params.get('type', None) or self.request.query_params.get('category_type', None)
        if cat_type:
            queryset = queryset.filter(category_type__iexact=cat_type)
        return queryset
