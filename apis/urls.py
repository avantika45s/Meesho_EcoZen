from django.urls import path
from . import views



urlpatterns = [
    path('signup/', views.sign_up, name = 'signup'),
    path('add', views.add, name = 'add'),
    path('update/<int:id>', views.update, name = 'update'),
    path('delete/<int:id>', views.delete, name = 'delete'),
    path('summary', views.expense_summary, name = 'summary'),
    path('add_user_status', views.add_user_status, name = 'add_user_status'),
    path('chatbot', views.chatbot_view, name = 'chatbot'),
    path('comparepredict',views.comparepredict,name='predict'),
    path('api/user/info/', views.user_info_api, name='user_info_api'),
    # path('process-emails/', views.process_emails_view, name='process_emails'),
    # path('process_emails/', views.process_emails_view, name='process_emails'),
    path('users/', views.UserListCreateView.as_view(), name='user-list-create'),
    # path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    # path('mail_expenses/', views.mail_expenses_view, name='mail_expenses'),
    path('mail_expense/', views.mail_expenses_page, name='mail_expenses_page'),
    # path('mail_expenses/', views.mail_expenses_view, name='mail_expenses_view'),
    # path('mail-expenses/', views.MailExpenseListCreateView.as_view(), name='mail-expense-list-create'),
    # path('mail-expenses/<int:pk>/', views.MailExpenseDetailView.as_view(), name='mail-expense-detail'),
    # path('user/<int:user_id>/credentials/', views.get_user_credentials, name='get_user_credentials'),
    path('', views.home, name='index'),
    path('login/', views.login_view, name='login'),
    path('api/analyze-size/', views.analyze_size, name='analyze_size'),
    path('popup/', views.popup, name='popup'),
]


