from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Group
from .serializers import GroupSerializer

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

    def join_group(self, request, group_code):
        group = Group.objects.filter(joining_code=group_code).first()
        if group:
            user = request.user
            group.user.add(user)
            return Response({'message': 'User joined group successfully'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

    def remove_member(self, request, group_id, user_id):
        group = Group.objects.get(id=group_id)
        user = group.user.filter(id=user_id).first()
        if user:
            group.user.remove(user)
            return Response({'message': 'User removed from group successfully'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'User not found in group'}, status=status.HTTP_404_NOT_FOUND)
    