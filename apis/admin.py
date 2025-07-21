from django.contrib import admin
from .models import Expense,UserStatus,MailExpense, Email, User

# Register your models here.
admin.site.register(Expense)
admin.site.register(UserStatus)
admin.site.register(MailExpense)
admin.site.register(Email)
admin.site.register(User)
