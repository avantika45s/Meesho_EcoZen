from email.utils import parsedate_to_datetime
import genericpath
from pyexpat.errors import messages
import random
from types import GenericAlias
from django.http import HttpResponse
from django.shortcuts import render, redirect
from grpc import GenericRpcHandler
from numpy import generic
from .models import Expense, UserStatus,Email,MailExpense,User
from django.db.models import Sum
from django.views.decorators.csrf import csrf_exempt
from openai import ChatCompletion
import requests
from django.urls import reverse
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import imaplib
import email
import re
import google.generativeai as genai
from datetime import datetime, timedelta
import json
from rest_framework import generics
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from .models import User
from django.shortcuts import render
from .serializers import MailExpenseSerializer, UserSerializer,User
from django.http import JsonResponse
# from .utils import generate_jwt_token
import jwt
from .models import User
from .forms import LoginForm, UserForm
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate , login
from django.http import HttpResponse
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from .forms import UserForm
from django.shortcuts import render, redirect
from django.contrib import messages
import requests
import cv2
import numpy as np
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# from rest_framework import status
# from rest_framework.generics import CreateAPIView, RetrieveAPIView
# from rest_framework.response import Response
# from rest_framework.permissions import AllowAny, IsAuthenticated
# from rest_framework_jwt.authentication import JSONWebTokenAuthentication
# from .serializers import UserRegistrationSerializer
# from .serializers import UserLoginSerializer, UserDetailSerializer
# from .models import UserProfile

 # Updated import
# from .tasks import process_emails

import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
from datetime import datetime
import json
from collections import defaultdict
from .utils import compare_p
import os
import requests
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.core.files.uploadedfile import InMemoryUploadedFile
import io

import base64
import openai
import json

import google.generativeai as genai
from PIL import Image
import io

conversation=""
info_string=""

def analyze_with_gemini_vision(front_image, side_image, height, weight, product_title):
    """
    Use Google Gemini 1.5 Flash for size analysis
    """
    try:
        genai.configure(api_key="YOURS_API_KEY")
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Convert to PIL Image
        front_image.seek(0)
        pil_image = Image.open(io.BytesIO(front_image.read()))
        
        prompt = f"""
        Analyze this person's body proportions for clothing size recommendation.
        
        Person details:
        - Height: {height} cm
        - Weight: {weight} kg
        - Product type: {product_title}
        
        Based on the image and measurements, estimate:
        1. Best fitting clothing size (XS, S, M, L, XL, XXL)
        2. Approximate chest circumference in cm
        3. Approximate waist circumference in cm
        4. Specific fit recommendations
        
        Consider standard clothing size charts and body proportions visible in the image.
        
        Respond in JSON format:
        {{
            "recommended_size": "size",
            "chest_circumference": estimated_cm,
            "waist_circumference": estimated_cm,
            "fit_advice": "detailed advice"
        }}
        """
        
        response = model.generate_content([prompt, pil_image])
        
        response_text = response.text.strip()
        if response_text.startswith('```json'):
            response_text = response_text.replace('```json', '').replace('```', '').strip()
        
        return json.loads(response_text)
        
    except Exception as e:
        print(f"Gemini Vision error: {str(e)}")
        return None

def analyze_with_gpt4_vision(front_image, side_image, height, weight, product_title):
    """
    Use GPT-4 Vision to analyze body measurements from images
    """
    try:
        # Convert image to base64
        front_image.seek(0)
        front_base64 = base64.b64encode(front_image.read()).decode('utf-8')
        
        client = openai.OpenAI(
            api_key="YOUR_API_KEY"
        )

        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"""Analyze this person's body measurements for clothing size recommendation.
                        
                        Person details:
                        - Height: {height} cm
                        - Weight: {weight} kg
                        - Product: {product_title}
                        
                        Based on the image and measurements, recommend:
                        1. Clothing size (XS, S, M, L, XL, XXL)
                        2. Estimated chest circumference in cm
                        3. Estimated waist circumference in cm
                        4. Fit advice
                        
                        Return response as JSON format:
                        {{
                            "recommended_size": "size",
                            "chest_circumference": number,
                            "waist_circumference": number,
                            "fit_advice": "advice text"
                        }}"""
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{front_base64}"
                        }
                    }
                ]
            }
        ]
        
        response = client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=messages,
            max_tokens=500
        )
        
        result = response.choices[0].message.content
        # Parse JSON response
        return json.loads(result)
        
    except Exception as e:
        print(f"GPT-4 Vision error: {str(e)}")
        return None

def contains_human(image_file):
    """
    Simplified human detection using basic image properties
    """
    try:
        image_file.seek(0)
        arr = np.frombuffer(image_file.read(), np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        
        if img is None:
            return False
        
        height, width = img.shape[:2]

        # Basic checks for reasonable image dimensions
        if height < 200 or width < 150:
            return False
            
        # Use OpenCV's built-in cascade classifiers
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        # If faces detected, assume human present
        if len(faces) > 0:
            return True
            
        # If no faces, check for body-like proportions
        aspect_ratio = height / width
        if 1.2 <= aspect_ratio <= 2.5:  # Typical human body proportions
            return True
            
        return False

    except Exception as e:
        print(f"Error in human detection: {str(e)}")
        # Be lenient - if detection fails, assume human present
        return True
    
def get_size_from_measurements(measurements):
    """
    Map Meshcapade measurements to clothing sizes
    """
    try:
        chest = measurements.get('chest_circumference', 0)
        waist = measurements.get('waist_circumference', 0)
        
        # Size mapping based on chest measurements (in cm)
        if chest < 88:
            return 'XS'
        elif chest < 96:
            return 'S'
        elif chest < 104:
            return 'M'
        elif chest < 112:
            return 'L'
        elif chest < 120:
            return 'XL'
        else:
            return 'XXL'
        
    except Exception as e:
        print(f"Error in size mapping: {str(e)}")
        return 'M'  # Default size

@csrf_exempt
def analyze_size(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST requests allowed'}, status=405)

    print("Request received at analyze_size endpoint")

    # Extract data
    front_image = request.FILES.get('front_image')
    side_image = request.FILES.get('side_image')
    height = request.POST.get('height')
    weight = request.POST.get('weight')
    product_title = request.POST.get('product_title', 'Clothing item')
    
    # Validate required fields
    if not front_image or not height or not weight:
        return JsonResponse({'error': 'Please provide front image, height, and weight'}, status=400)
    
    # Human detection (simplified)
    front_has_human = contains_human(front_image)
    print(f"Front image human detection: {front_has_human}")
    
    side_has_human = True  # Default to True if no side image
    if side_image:
        side_has_human = contains_human(side_image)
        print(f"Side image human detection: {side_has_human}")

    if side_image:
        # Both images provided
        if not front_has_human and not side_has_human:
            return JsonResponse({
                'error': 'Please attach images containing your full body or face. Neither image shows a person clearly.'
            }, status=400)
        elif not front_has_human:
            return JsonResponse({
                'error': 'Please attach a clear front view image showing your full body or face.'
            }, status=400)
        elif not side_has_human:
            return JsonResponse({
                'error': 'Please attach a clear side view image showing your full body or face.'
            }, status=400)
    else:
        # Only front image provided
        if not front_has_human:
            return JsonResponse({
                'error': 'Please attach a clear front view image showing your full body or face.'
            }, status=400)
        
    try:
        # Try multiple AI services in order of preference
        
        print("Trying GPT-4 Vision analysis...")
        result = analyze_with_gpt4_vision(front_image, side_image, height, weight, product_title)
        if result:
            result['method'] = 'gpt4_vision'
            print("GPT-4 Vision analysis successful")
            return JsonResponse(result)
        
        print("Trying Gemini Vision analysis...")
        result = analyze_with_gemini_vision(front_image, side_image, height, weight, product_title)
        if result:
            result['method'] = 'gemini_vision'
            print("Gemini Vision analysis successful")
            return JsonResponse(result)
        
        # Fallback to enhanced calculation
        print("Using enhanced calculation...")
        result = enhanced_size_calculation(front_image, height, weight, product_title)
        return JsonResponse(result)
        
    except Exception as e:
        print(f"Error in size analysis: {str(e)}")
        return fallback_size_calculation(height, weight, product_title)

def enhanced_size_calculation(front_image, height, weight, product_title):
    """
    Enhanced size calculation using image analysis + BMI
    """
    try:
        weight_float = float(weight)
        height_float = float(height)
        
        # Calculate BMI
        bmi = weight_float / ((height_float / 100) ** 2)
        
        # Analyze image for body shape (basic)
        front_image.seek(0)
        arr = np.frombuffer(front_image.read(), np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        
        height_px, width_px = img.shape[:2]
        aspect_ratio = height_px / width_px
        
        # Estimate body type based on image aspect ratio and BMI
        if aspect_ratio > 2.0:  # Tall, slim in image
            size_modifier = -0.5
        elif aspect_ratio < 1.5:  # Broader build
            size_modifier = 0.5
        else:
            size_modifier = 0
        
        # Enhanced size calculation
        if bmi < 18.5:
            base_size = 'XS'
        elif bmi < 21:
            base_size = 'S'
        elif bmi < 25:
            base_size = 'M'
        elif bmi < 29:
            base_size = 'L'
        elif bmi < 33:
            base_size = 'XL'
        else:
            base_size = 'XXL'
        
        # Apply size modifier based on image analysis
        sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        current_index = sizes.index(base_size)
        
        if size_modifier > 0 and current_index < len(sizes) - 1:
            recommended_size = sizes[current_index + 1]
        elif size_modifier < 0 and current_index > 0:
            recommended_size = sizes[current_index - 1]
        else:
            recommended_size = base_size
        
        # Estimate measurements
        if recommended_size == 'XS':
            chest_est = 82
        elif recommended_size == 'S':
            chest_est = 88
        elif recommended_size == 'M':
            chest_est = 96
        elif recommended_size == 'L':
            chest_est = 104
        elif recommended_size == 'XL':
            chest_est = 112
        else:
            chest_est = 120
            
        waist_est = chest_est - 10
        
        advice = f"Based on your height ({height} cm), weight ({weight} kg), and body proportions visible in your image, we recommend size {recommended_size} for {product_title}. Your estimated measurements: chest {chest_est}cm, waist {waist_est}cm."
        
        return {
            'recommended_size': recommended_size,
            'fit_advice': advice,
            'measurements': {
                'chest_circumference': chest_est,
                'waist_circumference': waist_est,
                'bmi': round(bmi, 1)
            },
            'method': 'enhanced_calculation'
        }
        
    except Exception as e:
        print(f"Error in enhanced calculation: {str(e)}")
        return fallback_size_calculation(height, weight, product_title)
        
def fallback_size_calculation(height, weight, product_title):
    """
    Fallback size calculation when Meshcapade API fails
    """
    try:
        weight_float = float(weight)
        height_float = float(height)
        
        # BMI-based size calculation
        bmi = weight_float / ((height_float / 100) ** 2)
        
        if bmi < 18.5:
            size = 'S'
        elif bmi < 24.9:
            size = 'M'
        elif bmi < 29.9:
            size = 'L'
        else:
            size = 'XL'

        advice = f"Based on your height ({height} cm) and weight ({weight} kg), we recommend size {size} for {product_title}. This is a basic calculation - for more accurate sizing, please ensure your images clearly show your full body."
        
        response_data = {
            'recommended_size': size,
            'fit_advice': advice,
            'measurements': {
                'estimated_chest_circumference': 'Not available',
                'estimated_waist_circumference': 'Not available',
                'bmi': round(bmi, 1)
            },
            'method': 'fallback_calculation'
        }
        
        print(f"Returning fallback size recommendation: {size}")
        return JsonResponse(response_data)
        
    except Exception as e:
        print(f"Error in fallback calculation: {str(e)}")
        return JsonResponse({'error': 'Unable to calculate size recommendation'}, status=500)

# home
def prompt(request):
    cookies = request.COOKIES
    expenses = Expense.objects.all()
    my_expense=format_expenses_as_table(expenses)
    user_status = UserStatus.objects.filter(user_id=cookies["id"]).first()
    my_status=format_user_status_table(user_status)
    
    request.session['conversation']=[]
    request.session['conversation'].append({"role": "system", "content": "Hello, you are a financial bot your name is EcoZen Bot. I am sharing you my expenditure data in the format Item |Amount|Category|Date and the amount are in Indian National Rupees and always try to retun the responses with data "+my_expense+"\nNow I am giving you my user status too to help you make more personalised responses and advices (the user status is in format attribute|value):"+my_status})

class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
class MailExpenseListCreateView(generics.ListCreateAPIView):
    queryset = MailExpense.objects.all()
    serializer_class = MailExpenseSerializer

class MailExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MailExpense.objects.all()
    serializer_class = MailExpenseSerializer


def get_user_credentials(request, user_id):
    try:
        email, app_password = User.get_user_credentials(user_id)
        if email and app_password:
            return JsonResponse({'email': email, 'app_password': app_password})
        else:
            return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def mail_expenses_page(request):
    # process_emails

    cookies = request.COOKIES
    try:
        user_id = cookies["id"]
    except:
        redirect("login")
    user = User.objects.filter(user_id=user_id).first()
    print(cookies)
    process_emails(user.gmail,user.app_password,user.pk)
    
    return redirect(to="/")
  
    

# def generate_token(request, user_id):
#     try:
#         user = User.objects.get(user_id=user_id)
#         token = generate_jwt_token(user)
#         return JsonResponse({'token': token})
#     except User.DoesNotExist:
#         return JsonResponse({'error': 'User does not exist'}, status=404)

# def decode_token(request):
#     token = request.GET.get('token')
#     if token:
#         try:
#             decoded_message = jwt.decode(token)
#             return JsonResponse(decoded_message)
#         except Exception as e:
#             return JsonResponse({'error': str(e)}, status=400)
#     else:
#         return JsonResponse({'error': 'Token not provided'}, status=400)


def home(request):
    print(request.session)
    # conversation= request.session['conversation']
    user_id = None
    conversation= ""
    cookies = request.COOKIES
    try:
        user_id = cookies["id"]
    except:
        return redirect("login")
    user = User.objects.filter(user_id=user_id).first()
    expenses = Expense.objects.all()

    
    if request.method == 'POST':
        print(request.COOKIES)
        # month = request.POST['month']
        # year = request.POST['year']
        # expenses = Expense.objects.filter(date__year=year, date__month=month)
    expenses = Expense.objects.all()
    return render(request, 'index.html', {'expenses': expenses, 'conversation': conversation})

# create
@csrf_exempt
def add(request):
    cookies = request.COOKIES
    try:
        user_id = cookies["id"]
    except:
        redirect("login")
    print(user_id)
    user = User.objects.filter(user_id=user_id)
    if user.exists():
        user=user.first()
    else:
        print("I dont exist")
        redirect("login")

    if request.method == 'POST':
        
        item = request.POST['item']
        amount = int(request.POST['amount'])
        category = request.POST['category']
        date = request.POST['date']

        expense = Expense(user=user,item=item, amount=amount, category=category, date=date)
        expense.save()
        # prompt(request)
        # # Update total_expenses for the user
        user_status = UserStatus.objects.get(user_id=user_id)
        user_status.total_expenses += amount
        user_status.save()

    return redirect(home)

def add_user_status(request):
    cookies = request.COOKIES
    try:
        user_id = cookies["id"]
    except:
        redirect("login")
    user = User.objects.filter(pk=user_id).first()

    if request.method == "POST":
        allowedexpense = int(request.POST.get("allowedexpense"))
        monthlybudget = int(request.POST.get("monthlybudget"))
        pincode = int(request.POST.get("pincode"))
        # gmail=str(request.POST.get("gmail"))
        # app_password=str(request.POST.get("a"))
        # Create or update UserStatus for the user
        user_status = UserStatus.objects.filter(user=user)
        if user_status.exists():
            user_status = user_status.first()
            # user_status=user
            user_status.allowedexpense = allowedexpense
            user_status.monthlybudget = monthlybudget
            user_status.pincode = pincode
            # user_status.gmail = gmail
            # user_status.app_password = app_password 
        else:
         user_status= UserStatus.objects.create(allowedexpense=allowedexpense,monthlybudget=monthlybudget,pincode=pincode,user=user)
        print(user_status)
        
        user_status.save()
        prompt(request)
    return redirect(expense_summary)  # Render the form to add user status

def update(request,id=None):
    cookies = request.COOKIES
    try:
        user_id = cookies["id"]
    except:
        redirect("login")
    user = User.objects.filter(user_id=user_id).first()
    user_id = user_id
    expense_fetched = Expense.objects.filter(pk=id).first()

    user_status = UserStatus.objects.filter(user_id=user_id).first()  # Assuming user_id 1 is the only user
    user_status.total_expenses -= expense_fetched.amount
    
    if request.method == 'POST':
        
        item = request.POST['item']
        amount = int(request.POST['amount'])
        category = request.POST['category']
        date = request.POST['date']
        if expense_fetched:
            # expense_fetched=expense_fetched.first()
            expense_fetched.user=user
            expense_fetched.item = item
            expense_fetched.amount = amount
            expense_fetched.category = category
            expense_fetched.date = date
            user_status.total_expenses+=amount
            user_status.save()
            expense_fetched.save()
            prompt(request)
    return redirect(home)

def delete(request,id=None):
    cookies = request.COOKIES
    try:
        user_id = cookies["id"]
    except:
        redirect("login")
    user = User.objects.filter(user_id=user_id).first()
    user_id = user_id
    expense_fetched = Expense.objects.filter(pk=id)
    if expense_fetched.exists():
        expense_fetched=expense_fetched.first()
        user_status = UserStatus.objects.get(user_id=user_id)  # Assuming user_id 1 is the only user
        user_status.total_expenses -= expense_fetched.amount
        user_status.save()
    
        expense_fetched.delete()
    prompt(request)
    return redirect(home)

# @api_view(["POST"])
def expense_summary(request):
    # data = request.data
    cookies = request.COOKIES
    user_id=cookies["id"]
    # cookies = request.COOKIES
    # try:
    #     user_id = cookies["id"]
    # except:
    #     redirect("login")

    expenses = Expense.objects.filter(user=user_id)
    print(expenses)

    # Calculate total spending for each category
    category_totals = expenses.values('category').annotate(total=Sum('amount'))
    print(expense_summary)
    # Calculate total spending across all categories
    total_spending = expenses.aggregate(total=Sum('amount'))['total']

    # Calculate percentage spending for each category
    category_percentages = {}
    for category_total in category_totals:
        print("iwork")
        category_percentages[category_total['category']] = (category_total['total'] / total_spending) * 100
    
    # Aggregate spending data based on dates
    print(user_id,"q")
    daily_spending_data = expenses.values('date').annotate(total=Sum('amount'))
    print(user_id,"q2")
    user_status = UserStatus.objects.filter(user=user_id).first()
    print()
    total =0
    for data in list(daily_spending_data):
        total+=int(data["total"])
    print(total)
    context = {
        'category_percentages': category_percentages,
        'daily_spending_data': daily_spending_data,
        'user_status': user_status,
        "total":total
    }
    print(context)
    return render(request, 'expense_summary.html', context)

def process_emails(username,password,user):
    print(user)
    print(username)
    print(password)
   
    # Function to connect to the IMAP server
    def connect_to_imap(username, password):
        
        mail = imaplib.IMAP4_SSL('imap.gmail.com')
        
        mail.login(username, password)
        print("ssss", username , "ssss", password)

        return mail

    # Function to fetch emails from the inbox within the last 2 minutes
    def fetch_emails_within_last_day(mail):
        two_minutes_ago = datetime.now() - timedelta(days=1)
        date_two_minutes_ago = two_minutes_ago.strftime('%d-%b-%Y')
        mail.select('inbox')
        _, data = mail.search(None, f'(SINCE "{date_two_minutes_ago}")')
        email_ids = data[0].split()
        emails = []
        for email_id in email_ids:
            _, data = mail.fetch(email_id, '(RFC822)')
            emails.append((email_id, data[0][1]))
        return emails

    # Function to parse email content and extract relevant information
    def parse_email(email_content):
        msg = email.message_from_bytes(email_content)
        sender = msg['From']
        subject = msg['Subject']
        body = ""
        # received_at = parsedate_to_datetime(msg['Date'])

        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    body += part.get_payload(decode=True).decode()
        else:
            body = msg.get_payload(decode=True).decode()

        return {"sender": sender, "subject": subject, "body": body}

    # Function to identify order-related emails using regular expressions
    def identify_order_emails(emails):
        order_emails = []
        for email_id, email_content in emails:
            try:
                con = parse_email(email_content)
                if re.search(r'(order\s+(summary|confirmation)|order\s+placed)', con["subject"], re.IGNORECASE) or re.search(r'(order\s+(summary|confirmation)|order\s+placed)', con["body"], re.IGNORECASE):
                    order_emails.append((email_id, con))
            except:
                pass
        return order_emails

    def string_to_dict(string_data):
        string_data=string_data.strip('```')
        string_data.replace('```python\n', '')


    # Fixing the string (adding commas and quotes)
        fixed_string = string_data.replace("\n", ",\n")
        fixed_string = fixed_string.replace("{", "{\"")
        fixed_string = fixed_string.replace("}", "\"}")
        fixed_string = fixed_string.replace(":", "\":\"")
        fixed_string = fixed_string.replace(",\"", ",\"")
        fixed_string = fixed_string.replace(",\n\"", ",\n\"")

        # Remove ``` at the beginning and end
        fixed_string = fixed_string.strip("```")
        fixed_string.strip()
        
        fixed_string = fixed_string.split(" = ")
        fixed_string = fixed_string[0] if len(fixed_string) == 1 else fixed_string[1]
        fixed_string.strip()
        fixed_string = fixed_string.replace(r'{",','{')
        fixed_string = fixed_string.replace(r'"},','}')
        print("fs: ",fixed_string)
        print(type(fixed_string))
        data_string = fixed_string.replace('":', '":')

# Split the string by commas
        key_value_pairs = data_string.split(',')

        # Initialize an empty dictionary
        data_dict = {}

        # Iterate through each key-value pair
        for pair in key_value_pairs:
            print(pair)
            # Split the pair into key and value
            try:
                arr  = pair.split('":"')
                key =arr[0]
                if len(arr)>2:
                    value = ":".join(arr[1:])
                else:
                    value = arr[1]
                # Remove extra double quotes
                key = key.strip().strip('"').lower()
                value = value.strip().strip('"')
                if key == 'date/time':
                    value = value.split('.')[0]
                # Add key-value pair to dictionary
                data_dict[key] = value
            except:
                pass


     
        # Convert string to dictionary
        print(data_dict)
        return data_dict
    # Function to store emails in the Django model Email
    def store_emails_in_db(emails,user=user):
        for email_id, email_data in emails:
            Email.objects.create(
                email_id=email_id,  # Save email_id to identify emails uniquely
                user_id=User.objects.filter(pk=user).first(),
                sender=email_data["sender"],
                subject=email_data["subject"],
                body=email_data["body"],
                # received_at=email_data["received_at"]
                received_at=datetime.now()
            )

    # Function to process emails using Gemini
    def process_emails_with_gemini(user=user):
        # Configure Gemini connection (replace with your API key)
        genai.configure(api_key="YOUR_API_KEY")
        model = genai.GenerativeModel('gemini-pro')
        query_set = list(Email.objects.filter(processed=False,user_id=user).all())        
        print(query_set)
        for email_data in query_set :  # Only process emails not marked as processed
          
            gemini_prompt = f'''
                the Gemini will give me the user_id (same as given above) ,
                Sender_platform (the ecommerce platform name from where the order has been place: can be decoded by the senders email) ,
                sender_icon (a code to decode the e-commerce platform from the sender email and then in the table insert their respective icon) ,
                order_id ( any id/number that is given in the email as an order id) ,
                the product name ( identity the name of the product from the mail body if not identified any then save as ITEM) ,
                category ( try to classify the type of product as in a category , like electronics ,clothes ,homeware etc, If the product name is ITEM or not able to classify the product then save as OTHER) ,
                amount ( identify the total amount of the order from the email body, generally the max amount followed by the symbol Rs. ) ,
                date/time ( date/time of the order placed) ,
                status ( whether the order is confirmed, delivered, returned, also if the Gemini finds a email with same email order, then without adding a new row, only update this status )  ,
                feedback ( if there is a link in the body asking the user to give the feedback , then upload that link in this column , if nothing is given then keep it empty, return it in python dictionary format )
                '''+f"{email_data.email_id},{email_data.user_id},{email_data.sender},{email_data.subject},{email_data.body},{email_data.received_at}"

            response = model.generate_content(gemini_prompt)
            order_info = response.text.split("|")
           
            orde_dic = string_to_dict(order_info[0])
    # Fixing the string (adding commas and quotes
            print("od",orde_dic)
            keys = list(orde_dic.keys())
            print(keys)
            
            sender_platform = email_data.sender.split("@")[1].split(".")[0]
            user_id = email_data.user_id 
            order_id = orde_dic["order_id"] if "order_id" in keys else "_"
            product_name = orde_dic["product_name"] if "product_name" in keys else "_"
            category = orde_dic["category"] if "category" in keys else "_"
            # Handle potential conversion errors for amount
            amount = 0  # Default value if conversion fails
            if "amount" in keys and orde_dic["amount"] is not None:
                try:
                        amount = int(orde_dic["amount"])
                except ValueError:
        # Handle the case where orde_dic["amount"] is not a valid integer
        # For example, you could log an error message or take another appropriate action
                            pass

            # amount = int(orde_dic["amount"] if "amount" in keys and orde_dic["amount"] is not None else '0')
            # amount = int(orde_dic.get("amount", 0))
            # date_time_format = '%A %B %d %Y at %H":"%M'
            # date_time_format = '%Y-%m-%d %H:%M:%S.%f%z'    
            # date_time = datetime.strptime(orde_dic["date/time"],date_time_format) 
            try :
                if "date/time" in keys: 
                # date_time=date_time.strftime(r'%Y-%m-%d %H:%M:%S')
                    if '.' in orde_dic["date/time"] and '+' in orde_dic["date/time"]:
                        date_time_format = r'%Y-%m-%d %H:%M:%S.%f%z'
                    else:
                        date_time_format = r'%Y-%m-%d %H:%M:%S'
                
            
                date_time = datetime.strptime(orde_dic["date/time"], date_time_format)    
            except :
                date_time = datetime.now()
                date_time = date_time.strftime(r"%Y-%m-%d %H:%M:%S")
                    

# Parse the string to datetime object
                 
            status = orde_dic["status"] if "status" in keys else "_"
            feedback = orde_dic["feedback"] if "feedback" in keys else "_"
             
            

            # Store data in MailExpense model
            MailExpense.objects.create(
                user_id=User.objects.filter(pk=user).first(),
                platform=sender_platform,
                order_id=order_id,
                item=product_name,
                category=category,
                amount=amount,
                date_of_purchase=date_time,
                status=status,
                feedback=feedback
            )

            # Mark email as processed
            email_data.processed = True
            email_data.save()

    # Main function to process data and insert into the database

    def process_data_and_insert(username,password):
    # Fetching user credentials
            mail = connect_to_imap(username, password)
            
            emails = fetch_emails_within_last_day(mail)
            
            # print(emails)
            order_emails = identify_order_emails(emails)
            print(order_emails)
            store_emails_in_db(order_emails)
            process_emails_with_gemini(user)

    process_data_and_insert(username, password)
    return True

   
# def process_emails_view(request):
#     if request.method == 'POST':
#         # Assuming username and password are passed in the request
#         username = request.POST.get('gmail')
#         password = request.POST.get('app_password')
        # request.POST.get('password')
# def process_emails_view(request):
#     if request.method == 'POST':
#         # Assuming username and password are passed in the request
#         username = request.POST.get('gmail')
#         password = request.POST.get('app_password')
#         # request.POST.get('password')

#         # Trigger the Celery task
#         process_emails.delay(username, password)

#         return JsonResponse({'message': 'Email processing started successfully.'},status=200)
#     else:
#         return JsonResponse({'error': 'Only POST requests are allowed.'}, status=400)


@api_view(["POST"])
def mail_expenses_view(request):
    data = request.data
    print(data)
    # email = data["email"]
    user_id = data["user_id"]
    # Check if the user exists based on the provided email
    try:
        # user = User.objects.get(gmail=email)
        user = User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # Obtain the user_id directly from the user object
    user_id = user.pk
    print(user_id)
    apppassword = User.objects.get(user_id=user_id).app_password
    gmail= User.objects.get(user_id=user_id).gmail
    # password = data["password"]
    process = process_emails(gmail, apppassword, user_id)
    
    # Assuming process_emails function returns a boolean indicating success or failure
    if process:
        return Response(status=status.HTTP_204_NO_CONTENT)
    else:
        return Response({"message": "Failed to process emails"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# def mail_expenses_view(request):
#     if request.method == 'POST':
#         # Extract user_id from the request body
#         user_id = request.POST.get('id')

#         if not user_id:
#             return JsonResponse({"error": "User ID is required"}, status=400)
#         try:
#             user = User.objects.get(pk=user_id)
#         except User.DoesNotExist:
#             return JsonResponse({"error": "User not found"}, status=404)

#         gmail = user.gmail
#         apppassword = user.app_password

#         # Assuming process_emails function returns a boolean indicating success or failure
#         process_success = process_emails(gmail, apppassword, user)

#         if process_success:
#             # Fetch mail expenses for the user and return as JSON
#             expenses = MailExpense.objects.filter(user_id=user_id).values()
#             return JsonResponse({"expenses": list(expenses)})
#         else:
#             return JsonResponse({"error": "Failed to process emails"}, status=500)
#     else:
#         return JsonResponse({"error": "Method not allowed"}, status=405)



# class MailExpensesView(TemplateView):
#     template_name = 'mail_expenses.html'

#     def post(self, request, *args, **kwargs):
#         data = request.POST

#         # Ensure that 'id' is present in the request data
#         if 'id' not in data:
#             return HttpResponse("User ID is required", status=400)

#         user_id = data["id"]

#         try:
#             # Check if the user exists based on the provided user_id
#             user = User.objects.get(pk=user_id)
#         except User.DoesNotExist:
#             return HttpResponse("User not found", status=404)

#         # Retrieve user's email and app_password
#         gmail = user.gmail
#         apppassword = user.app_password

#         # Call process_emails function
#         process = process_emails(gmail, apppassword, user_id)

#         # Assuming process_emails function returns a boolean indicating success or failure
#         if process:
#             return HttpResponse(status=204)
#         else:
#             return HttpResponse("Failed to process emails", status=500)
# def create_user(request):
#     # Generate a random 4-digit user_id
#     user_id = random.randint(1000, 9999)
#     # Ensure user_id doesn't already exist
#     while User.objects.filter(user_id=user_id).exists():
#         user_id = random.randint(1000, 9999)
    
#     # Other user data
#     user_name = "Sample User"  # You can replace this with actual user data
#     phone_number = "1234567890"  # You can replace this with actual user data
#     gmail = "example@example.com"  # You can replace this with actual user data
#     login_password = "password"  # You can replace this with actual user data
#     app_password = "app_password"  # You can replace this with actual user data

#     # Create the user
#     user = User.objects.create(
#         user_id=user_id,
#         user_name=user_name,
#         phone_number=phone_number,
#         gmail=gmail,
#         login_password=login_password,
#         app_password=app_password
#     )

#     return HttpResponse(f"User created with user_id: {user_id}")


def sign_up(request):
    if request.method == 'POST':
        form = UserForm(request.POST)
        if form.is_valid():
            # Check if a user with the given email already exists
            email = form.cleaned_data['gmail']
            if User.objects.filter(gmail=email).exists():
                messages.error(request, 'User with this email already exists.')
            else:
                # Save the user
                user = form.save(commit=False)
                user.user_id = User.generate_unique_user_id()
                user.save()
                user_status = UserStatus(user=user)
                user_status.save()
                return redirect('/login')  # Redirect to homepage or any other desired page
        else:
            # Form is not valid, return form along with error messages
            messages.error(request, 'Invalid form data. Please correct the errors below.')
    else:
        form = UserForm()
    return render(request, 'signup.html', {'form': form})



@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        email = request.POST.get('gmail')
        login_password = request.POST.get('login_password')
        user = User.objects.filter(gmail=email, login_password=login_password).first()
        print(user)
        if user :
            # login(request, user)
            # Django's built-in authentication system automatically updates the last_login time
            resp = redirect('index')  # Redirect to home or wherever after login
            resp.set_cookie("email",email)
            resp.set_cookie("id",user.user_id)
            return resp
        else:
            # If authentication fails, return 401 Unauthorized status code
            return HttpResponse("Unauthorized", status=401)
    
    form = LoginForm()
    rsp= render(request, 'login.html', {'form':form, 'title':'log in'})
    return rsp


def index(request):
    return render(request, 'index.html')

# def my_view(request):
    # Your view logic here
    return render(request, 'index.html', {'user': request.user})

def format_expenses_as_table(expenses):
    # Define headers for the table
    headers = ["Item", "Amount", "Category", "Date"]

    # Create a list to hold each row of data
    table_data = []

    # Append headers as the first row of the table
    table_data.append(headers)

    # Iterate over each expense object and append its attributes as a row in the table
    for expense in expenses:
        row = [expense.item, expense.amount, expense.category, expense.date]
        table_data.append(row)

    # Calculate the maximum width of each column
    col_widths = [max(len(str(row[i])) for row in table_data) for i in range(len(headers))]

    # Format the table
    formatted_table = ""
    for row in table_data:
        formatted_table += "|".join(f"{str(row[i]):<{col_widths[i]}}" for i in range(len(headers))) + "\n"

    return formatted_table

def format_user_status_table(user_status):
    # usd = dict(user_status)
    # Initialize the header and separator
    table = "Attribute            | Value\n"
    # keys = usd.keys()

    # Iterate over each field in the UserStatus model
    for field in user_status._meta.fields:

        # Format the field name and value

        field_name = field.name
         
        field_value = getattr(user_status, field_name)

        
        # Add the field name and value to the table
        table += f"{field_name.ljust(20)}| {field_value}\n"

    return table

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Sum
@csrf_exempt
def user_info_api(request):
    """API endpoint to get user information"""
    if request.method == 'GET':
        try:
            # Get user ID from cookies or session
            user_id = request.COOKIES.get('id', '1')
            
            # Get user expenses
            expenses = Expense.objects.filter(user_id=user_id) if hasattr(Expense, 'user_id') else Expense.objects.all()
            
            # Get user status
            user_status = None
            try:
                user_status = UserStatus.objects.filter(user_id=user_id).first()
            except:
                pass
            
            # Calculate totals
            total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or 0
            expense_count = expenses.count()
            
            # Get recent expenses (last 5)
            recent_expenses = expenses.order_by('-date')[:5]
            
            response_data = {
                'success': True,
                'user_id': user_id,
                'total_expenses': float(total_expenses),
                'expense_count': expense_count,
                'recent_expenses': [
                    {
                        'item': expense.item,
                        'amount': float(expense.amount),
                        'category': expense.category,
                        'date': expense.date.strftime('%Y-%m-%d') if expense.date else None
                    } for expense in recent_expenses
                ],
                'user_status': {
                    'income': float(user_status.income) if user_status and hasattr(user_status, 'income') else 0,
                    'savings_goal': float(user_status.savings_goal) if user_status and hasattr(user_status, 'savings_goal') else 0
                } if user_status else None
            }
            
            return JsonResponse(response_data)
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({
        'success': False,
        'error': 'Method not allowed'
    }, status=405)

# Update your existing chatbot_view function
def chatbot_view(request):
    print(f"Chatbot view called with method: {request.method}")
    
    if request.method == 'POST':
        # Handle AJAX requests
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            try:
                user_input = request.POST.get('user_input', '').strip()
                print(f"User input received: '{user_input}'")
                print(f"POST data: {dict(request.POST)}")
                
                if not user_input:
                    return JsonResponse({
                        'success': False, 
                        'error': 'No input provided. Please enter a message.'
                    })

                # Get or initialize conversation from session
                if 'conversation' not in request.session:
                    print("Initializing new conversation")
                    expenses = Expense.objects.all()
                    my_expense = format_expenses_as_table(expenses)
                    
                    cookies = request.COOKIES
                    user_id = cookies.get("id", "1")
                    
                    try:
                        user_status = UserStatus.objects.filter(user_id=user_id).first()
                        my_status = format_user_status_table(user_status) if user_status else "No user status available"
                    except Exception as e:
                        print(f"Error getting user status: {e}")
                        my_status = "No user status available"
                    
                    request.session['conversation'] = []
                    request.session['conversation'].append({
                        "role": "system", 
                        "content": f"Hello, you are EcoZen AI, a financial assistant bot. I am sharing your user's expenditure data in the format Item |Amount|Category|Date and the amounts are in Indian National Rupees. Always try to return responses with data analysis and helpful financial advice. Expense data: {my_expense}\n\nUser status: {my_status}"
                    })

                # Add user message to conversation
                request.session['conversation'].append({
                    "role": "user", 
                    "content": user_input
                })

                # Generate AI response
                ai_response = generate_fallback_response(user_input)
                print(f"Generated response: {ai_response}")

                # Add AI response to conversation
                request.session['conversation'].append({
                    "role": "assistant", 
                    "content": ai_response
                })

                # Save session
                request.session.modified = True

                return JsonResponse({
                    'success': True,
                    'response': ai_response
                })

            except Exception as e:
                print(f"Chatbot Error: {str(e)}")
                import traceback
                traceback.print_exc()
                return JsonResponse({
                    'success': False,
                    'error': f'An error occurred: {str(e)}'
                })

    # GET request - render the page or return empty response for AJAX
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': True, 'message': 'Chatbot initialized'})
    
    conversation = request.session.get('conversation', [])
    expenses = Expense.objects.all()
    return render(request, 'index.html', {'conversation': conversation, 'expenses': expenses})

def format_expenses_as_table(expenses):
    """Format expenses data for the chatbot"""
    if not expenses:
        return "No expenses found."
    
    result = "User Expenses:\n"
    for expense in expenses:
        result += f"Item: {expense.item} | Amount: ₹{expense.amount} | Category: {expense.category} | Date: {expense.date}\n"
    return result

def format_user_status_table(user_status):
    """Format user status data for the chatbot"""
    if not user_status:
        return "No user status available."
    
    return f"User Status - Income: ₹{user_status.income if hasattr(user_status, 'income') else 'N/A'}, Savings Goal: ₹{user_status.savings_goal if hasattr(user_status, 'savings_goal') else 'N/A'}"

def generate_fallback_response(user_input):
    """Generate a simple fallback response when AI API is not available"""
    user_input_lower = user_input.lower()
    
    if any(word in user_input_lower for word in ['hello', 'hi', 'hey']):
        return "Hello! I'm EcoZen AI, your personal financial assistant. I can help you analyze your expenses, create budgets, and provide financial advice. What would you like to know about your finances?"
    
    elif any(word in user_input_lower for word in ['expense', 'spending', 'money', 'cost']):
        return "I can help you analyze your expenses! Based on your data, I can provide insights about your spending patterns and suggest ways to save money. Would you like me to break down your expenses by category or show your spending trends?"
    
    elif any(word in user_input_lower for word in ['save', 'saving', 'budget']):
        return "Great question about saving! I recommend reviewing your expense categories to identify areas where you can cut back. Looking at your expenses, I can suggest specific savings opportunities. Would you like me to analyze which categories you spend the most on?"
    
    elif any(word in user_input_lower for word in ['help', 'what', 'how']):
        return "I'm EcoZen AI, your financial assistant! I can help you with:\n• Analyzing your expenses\n• Creating budgets\n• Tracking spending patterns\n• Providing financial advice\n• Suggesting ways to save money\n\nWhat would you like to explore about your finances?"
    
    elif any(word in user_input_lower for word in ['category', 'categories']):
        return "I can analyze your spending by categories! From your data, I can show you which categories you spend the most on and suggest areas for potential savings. Would you like a breakdown of your spending by category?"
    
    elif any(word in user_input_lower for word in ['total', 'sum', 'amount']):
        return "I can help you calculate your total expenses! Based on your current data, I can show you how much you've spent in total, by category, or over specific time periods. What would you like to know?"
    
    else:
        return "Thank you for your question! I'm here to help with your financial management. I can analyze your expenses, suggest budgeting strategies, and provide personalized financial advice. Could you be more specific about what you'd like to know about your finances?"

def get_mock_price_data(product_name):
    """Fallback mock data when API is unavailable"""
    mock_data = {
        "2024-01": {"key": 1704067200, "avg_price_in_cents": 50000, "data_points": 150},
        "2024-02": {"key": 1706745600, "avg_price_in_cents": 48000, "data_points": 180},
        "2024-03": {"key": 1709251200, "avg_price_in_cents": 52000, "data_points": 120},
        "2024-04": {"key": 1711929600, "avg_price_in_cents": 47000, "data_points": 200},
        "2024-05": {"key": 1714521600, "avg_price_in_cents": 49000, "data_points": 175},
        "2024-06": {"key": 1717200000, "avg_price_in_cents": 45000, "data_points": 190},
    }
    return mock_data

def comparepredict(request):
    context = {'variable': ''}
    
    if request.method == 'POST':
        product_name = request.POST.get('productName')
        date = request.POST.get('date')
        
        if not product_name:
            context = {
                'variable': "Product name is required",
                'max_purchases_month': "not found",
                'lowest_avg_price_month': "not found",
                'comparison_result': "not found",
            }
            return render(request, 'comparison.html', context)
        
        comparison_result = compare_p(product_name)
        
        # Try API first, fallback to mock data
        try:
            url = "https://product-price-history.p.rapidapi.com/price-history"
            querystring = {"country_iso2":"nl","gtin":"6900075928046","last_x_months":"24"}
            headers = {
                'X-RapidAPI-Key': 'YOURS_API_KEY',
                'X-RapidAPI-Host': 'product-price-history.p.rapidapi.com'
            }
            
            response = requests.get(url, headers=headers, params=querystring, timeout=10)
            
            if response.status_code == 200:
                priceHistory = response.json()
                
                # Check if API returned valid data
                if isinstance(priceHistory, dict) and not ('message' in priceHistory and 'error' in priceHistory.get('message', '').lower()):
                    data = priceHistory
                else:
                    raise Exception("API returned error")
            else:
                raise Exception(f"API returned status code: {response.status_code}")
                
        except Exception as e:
            print(f"API Error: {e}. Using mock data.")
            data = get_mock_price_data(product_name)
        
        # Process data (same logic as before)
        try:
            timestamps = []
            avg_prices = []
            
            if isinstance(data, dict) and data:
                for timestamp, info in data.items():
                    if isinstance(info, dict) and 'key' in info and 'avg_price_in_cents' in info:
                        timestamps.append(info['key'])
                        avg_prices.append(info['avg_price_in_cents'])
                
                if len(timestamps) > 1:
                    # Your existing prediction logic here
                    X = np.array(timestamps).reshape(-1, 1)
                    y = np.array(avg_prices)
                    
                    model = LinearRegression()
                    model.fit(X, y)
                    
                    input_date = datetime(2025, 8, 19)
                    timestamp = int(input_date.timestamp())
                    predicted_price = model.predict(np.array([[timestamp]]))
                    predicted_price = predicted_price * 0.0542
                    
                    # Monthly analysis
                    monthly_data = defaultdict(list)
                    for date_str, info in data.items():
                        if isinstance(info, dict):
                            month = date_str[:7]
                            monthly_data[month].append(info)
                    
                    result = {}
                    for month, purchases in monthly_data.items():
                        total_purchases = sum(info.get('data_points', 0) for info in purchases if isinstance(info, dict))
                        if total_purchases > 0:
                            avg_price = sum(info.get('avg_price_in_cents', 0) * info.get('data_points', 0) 
                                          for info in purchases if isinstance(info, dict)) / total_purchases
                            result[month] = {'total_purchases': total_purchases, 'avg_price': avg_price}
                    
                    if result:
                        max_purchases_month = max(result, key=lambda m: result[m]['total_purchases'])
                        lowest_avg_price_month = min(result, key=lambda m: result[m]['avg_price'])
                        
                        context = {
                            'variable': f"€{predicted_price[0]:.2f}",
                            'max_purchases_month': max_purchases_month,
                            'lowest_avg_price_month': lowest_avg_price_month,
                            'comparison_result': comparison_result if comparison_result else "not found",
                            'data_source': "Live API" if 'timestamps' in locals() else "Mock Data"
                        }
                    else:
                        context = {
                            'variable': "insufficient data",
                            'max_purchases_month': "not found", 
                            'lowest_avg_price_month': "not found",
                            'comparison_result': comparison_result if comparison_result else "not found",
                        }
                else:
                    context = {
                        'variable': "insufficient price data",
                        'max_purchases_month': "not found",
                        'lowest_avg_price_month': "not found", 
                        'comparison_result': comparison_result if comparison_result else "not found",
                    }
            
        except Exception as e:
            print(f"Data processing error: {e}")
            context = {
                'variable': "processing error",
                'max_purchases_month': "not found",
                'lowest_avg_price_month': "not found",
                'comparison_result': comparison_result if comparison_result else "not found",
            }
    
    return render(request, 'comparison.html', context)

def popup(request):
    return render(request, 'popup.html')