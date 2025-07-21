# apis/forms.py

from django import forms

from apis.serializers import MailExpenseSerializer
from .models import MailExpense, User

class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['user_name', 'phone_number', 'gmail', 'login_password', 'app_password']


class LoginForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['gmail', 'login_password']



# class mail_expenses_form(forms.ModelForm):
#     class Meta:
#         model = User
#         fields = ['user_id']
        

# class expenseForm(forms.Form):
#     class Meta:
#         model =User
#         fields =["user_id"]      
        

class UserIdForm(forms.Form):
    user_id = forms.IntegerField(label='User ID')       