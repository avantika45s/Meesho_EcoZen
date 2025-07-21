from datetime import timezone
import random
import uuid
from django.db import models
# from django.contrib.auth.models import BaseUserManager
from django.core.validators import RegexValidator


# Create your models here.


# class UserManager(BaseUserManager):
#     def create_user(self, email, password=None):
#         """
#         Create and return a `User` with an email, username and password.
#         """
#         if not email:
#             raise ValueError("Users Must Have an email address")

#         user = self.model(
#             email=self.normalize_email(email),
#         )
#         user.set_password(password)
#         user.save(using=self._db)
#         return user

#     def create_superuser(self, email, password):
#         """
#         Create and return a `User` with superuser (admin) permissions.
#         """
#         if password is None:
#             raise TypeError("Superusers must have a password.")

#         user = self.create_user(email, password)
#         user.is_superuser = True
#         user.is_staff = True
#         user.save()

#         return user



class User(models.Model):
    user_id = models.IntegerField(primary_key=True, unique=True)
    user_name =models.CharField(max_length=100)
    phone_regex = RegexValidator(regex=r'^\d{10}$', message="Phone number must be exactly 10 digits.")
    phone_number = models.CharField(validators=[phone_regex], max_length=10,blank=True)
    gmail = models.CharField(max_length = 50)
    login_password=models.CharField(max_length=55)
    app_password = models.CharField(max_length = 50)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)

    # USERNAME_FIELD = "email"
    # REQUIRED_FIELDS = []

    def __str__(self):
        return self.gmail
    
    def save(self, *args, **kwargs):
        if not self.user_id:
            last_user = User.objects.order_by('-user_id').first()
            if last_user:
                self.user_id = last_user.user_id + 1
            else:
                self.user_id = 1
        super(User, self).save(*args, **kwargs)
    @classmethod
    def generate_unique_user_id(cls):
        while True:
            user_id = random.randint(1000, 9999)  # Generate a random 4-digit user_id
            if not cls.objects.filter(user_id=user_id).exists():  # Check if user_id is unique
                return user_id    

    @classmethod
    def get_user_credentials(cls, user_id):
        try:
            user = cls.objects.get(user_id=user_id)
            return user.gmail, user.app_password
        except cls.DoesNotExist:
            return None, None
        

    def set_last_login(self):
        self.last_login = timezone.now()
        self.save(update_fields=['last_login'])

    class Meta:
        db_table = 'user'

class UserStatus(models.Model):
    # user_id = models.ForeignKey(User, on_delete=models.CASCADE,null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE,null=True)
    total_expenses = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)
    allowedexpense = models.IntegerField(default=0)
    monthlybudget = models.IntegerField(default=0)
    pincode = models.IntegerField(null=True)  # Assuming pincode can be nullable

    @property
    def score(self):
        if self.allowedexpense != 0:
            print(self.allowedexpense)
            if self.allowedexpense > self.total_expenses:
                return min(round((1 - (self.total_expenses / self.allowedexpense)) * 100, 2),100)
            else:
                return 0

        else:
            return None

    @property
    def currentbalance(self):
        print("cb",self.monthlybudget - self.total_expenses,self.monthlybudget,self.total_expenses)
        return self.monthlybudget - self.total_expenses
    
    class Meta:
        db_table='user_status'


# class MailExpense(models.Model):
#     user_id = models.ForeignKey(User, on_delete=models.CASCADE,null=True)
#     id = models.AutoField(primary_key=True)
#     # user_id = models.CharField(max_length=255)
#     amount = models.PositiveIntegerField()
#     item = models.TextField()
#     category = models.TextField()
#     date_of_purchase = models.DateTimeField()
#     platform = models.TextField(default="self")
#     status = models.TextField()
#     order_id = models.TextField()
#     feedback = models.TextField()


class Expense(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE,null=True)
    item = models.CharField(max_length = 50)
    amount = models.IntegerField()
    category = models.CharField(max_length=50)
    date = models.DateField()
    
# User key to identify for which user the expense is added
    def __str__(self):
        return self.item
    class Meta:
        db_table = 'expense'

class Email(models.Model):
    id = models.AutoField(primary_key=True)
    email_id=models.CharField(max_length=255, default ='')
    user_id = models.ForeignKey(User, on_delete=models.CASCADE) # user_id = models.CharField(max_length=255)
    sender = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    received_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)
    def __str__(self):
        return f'{self.subject} - {self.sender}'
    

class MailExpense(models.Model):
    
    id = models.AutoField(primary_key=True)
    # user_id = models.CharField(max_length=255)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.PositiveIntegerField()
    item = models.TextField()
    category = models.TextField()
    date_of_purchase = models.DateTimeField()
    platform = models.TextField(default="self")
    status = models.TextField()
    order_id = models.TextField()
    feedback = models.TextField()


    
# User key to identify for which user the expense is added
    def __str__(self):       return self.item
    def __str__(self):
        return self.item
    class Meta:
        db_table = 'mailexpense'


# class UserProfile(models.Model):
#     """
#     to store all other attributes associated to user
#     """

#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     user = models.OneToOneField(UserStatus, on_delete=models.CASCADE, related_name="profile")
#     name = models.CharField(max_length=50, unique=False)

#     class Meta:
#         """
#         to set table name in database
#         """

#         db_table = "profile" 