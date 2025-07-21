from rest_framework import serializers
from .models import  User,  UserStatus,  MailExpense , Expense
# from django.contrib.auth import authenticate
# from django.contrib.auth.models import update_last_login
# from rest_framework import serializers
# from rest_framework_jwt.settings import api_settings
# from .models import UserProfile
# from .models import UserStatus

# JWT_PAYLOAD_HANDLER = api_settings.JWT_PAYLOAD_HANDLER
# JWT_ENCODE_HANDLER = api_settings.JWT_ENCODE_HANDLER


# class PincodeSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Pincode
#         fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

# class SiteSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Site
#         fields = '__all__'

# class CategorySerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Category
#         fields = '__all__'

# class ProductSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Product
#         fields = '__all__'

# class PPSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = PP
#         fields = '__all__'

class ExpensesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

class UserStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStatus
        fields = '__all__'

# class LeaderboardSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Leaderboard
#         fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'user_name', 'phone_number', 'gmail', 'login_password', 'app_password', 'is_active', 'is_staff', 'is_superuser']

class MailExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = MailExpense
        fields = '__all__'



# class UserRegistrationSerializer(serializers.ModelSerializer):

#     profile = UserSerializer(required=False)

#     class Meta:
#         model = UserStatus  # Updated model reference
#         fields = ("email", "password", "profile")
#         extra_kwargs = {"password": {"write_only": True}}

#     def create(self, validated_data):
#         profile_data = validated_data.pop("profile", None)
#         user = UserStatus.objects.create_user(**validated_data)  # Updated model reference
#         if profile_data:
#             UserProfile.objects.create(user=user, name=profile_data["name"])
#         return user


# class UserLoginSerializer(serializers.Serializer):

#     email = serializers.CharField(max_length=255)
#     password = serializers.CharField(max_length=128, write_only=True)
#     token = serializers.CharField(max_length=255, read_only=True)

#     def validate(self, data):
#         email = data.get("email", None)
#         password = data.get("password", None)
#         user = authenticate(email=email, password=password)
#         if user is None:
#             raise serializers.ValidationError(
#                 "A user with this email and password is not found."
#             )
#         try:
#             payload = JWT_PAYLOAD_HANDLER(user)
#             jwt_token = JWT_ENCODE_HANDLER(payload)
#             update_last_login(None, user)
#         except UserStatus.DoesNotExist:  # Updated model reference
#             raise serializers.ValidationError(
#                 "User with given email and password does not exists"
#             )
#         return {"email": user.email, "token": jwt_token}


# class UserDetailSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = UserStatus  # Updated model reference
#         fields = ("email", "profile")
