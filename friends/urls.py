# from django.urls import path , include
# from rest_framework.routers import DefaultRouter
# from friends.views import GroupViewSet

# urlpatterns = [
#     # path('', views.friends_home, name='friends_home'),
#     # path('create_group/', views.create_group, name='create_group'),
#     # path('remove_member/<int:group_id>/<int:member_id>/', views.remove_member, name='remove_member'),
#     # path('change_group_name/<int:group_id>/', views.change_group_name, name='change_group_name'),
#     # # Add more URLs as needed
# ]



# router = DefaultRouter()
# router.register(r'groups', GroupViewSet)

# urlpatterns = [
#     path('', include(router.urls)),
#     path('groups/<str:group_code>/join/', GroupViewSet.join_group),
#     path('groups/<int:group_id>/remove_member/<int:user_id>/', GroupViewSet.remove_member),
#     path('', views.friends_home, name='friends_home'),
#     path('create_group/', views.create_group, name='create_group'),
#     path('remove_member/<int:group_id>/<int:member_id>/', views.remove_member, name='remove_member'),
#     path('change_group_name/<int:group_id>/', views.change_group_name, name='change_group_name'),
# ]

