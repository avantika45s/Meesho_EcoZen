
# # # import imaplib
# # # import email
# # # import re
# # # from datetime import datetime, timedelta
# # # from apis.models import Email, MailExpense, UserStatus

# # # import json
# # # import google.generativeai as genai 
# # # from desis_project import celery
# # # from celery import shared_task
# # # from django.utils import timezone

# # # genai.configure(api_key="AIzaSyCvKJkmaRe-mSDEiz-biZS-xT2jkjGY9RU")
# # # model = genai.GenerativeModel('gemini-pro')

# # # @shared_task
# # # def process_emails(username="", password=""):
# # #     print("ok")
# # #     users = list(UserStatus.objects.all())
# # #     for user in users:
# # #         username = user.gmail
# # #         password= user.app_password
# # #         print(password)

# # #         try:
# # #             mail = imaplib.IMAP4_SSL('imap.gmail.com')
# # #             mail.login(username, password)

# # #             five_minutes_ago = datetime.now() - timedelta(minutes=5)
# # #             date_five_minutes_ago = five_minutes_ago.strftime('%d-%b-%Y')
# # #             mail.select('inbox')
# # #             _, data = mail.search(None, f'(SINCE "{date_five_minutes_ago}")')
# # #             email_ids = data[0].split()
# # #             emails = []
# # #             for email_id in email_ids:
# # #                 _, data = mail.fetch(email_id, '(RFC822)')
# # #                 emails.append(data[0][1])

# # #             order_emails = []
# # #             for email_content in emails:
# # #                 try:
# # #                     msg = email.message_from_bytes(email_content)
# # #                     sender = msg['From']
# # #                     subject = msg['Subject']
# # #                     body = ""
# # #                     if msg.is_multipart():
# # #                         for part in msg.walk():
# # #                             if part.get_content_type() == "text/plain":
# # #                                 body += part.get_payload(decode=True).decode()
# # #                     else:
# # #                         body = msg.get_payload(decode=True).decode()
                    
# # #                     if re.search(r'(order\s+(summary|confirmation)|order\s+placed)', subject, re.IGNORECASE) or \
# # #                         re.search(r'(order\s+(summary|confirmation)|order\s+placed)', body, re.IGNORECASE):
# # #                         order_emails.append({"sender": sender, "subject": subject, "body": body})
# # #                 except Exception as e:
# # #                     print(f"Error processing email: {str(e)}")

# # #                     # print('order emails')
          
# # #             for email_data in order_emails:
# # #                 gemini_prompt = '''the Gemini will give me the user_id (same as given above) , Sender_platform (the ecommerce platform name from where the order has been place: can be decoded by the senders email) ,sender_icon (a code to decode the e-commerce platform from the sender email and then in the table insert their respective icon) , order_id ( any id/number that is given in the email as an order id) , the product name ( identity the name of the product from the mail body if not identified any then save as ITEM) , category ( try to classify the type of product as in a category , like electronics ,clothes ,homeware etc, If the product name is ITEM or not able to classify the product then save as OTHER) , amount ( identify the total amount of the order from the email body, generally the max amount followed by the symbol Rs. ) , date/time ( date/time of the order placed) , status ( whether the order is confirmed, delivered, returned, also if the Gemini finds a email with same email order, then without adding a new row, only update this status )  , feedback ( if there is a link in the body asking the user to give the feedback , then upload that link in this column , if nothing is given then keep it empty )  

# # #     If the email body includes a cart order, then divide that cart into individual product items and then add that data in the new table in the same format as given above. on '''+f"{email_data['sender']},{email_data['subject']},{email_data['body']}"
# # #                 response = model.generate_content(gemini_prompt)
# # #                 order_info = response.text.split("|")
# # #                 # print(order_info)
# # #                 MailExpense.objects.create(
# # #                     user_id = email_data[1],
# # #                     amount=float(order_info[7]),  
# # #                     item=order_info[5],  
# # #                     category=order_info[6],  
# # #                     date_of_purchase=order_info[8],  
# # #                     platform=email_data['sender'].split('@')[1].split('.')[0],  
# # #                     status=order_info[9],  
# # #                     order_id=order_info[4],  
# # #                     feedback=order_info[10],  
# # #                 )

# # #                 Email.objects.create(
# # #                     sender=email_data['sender'],
# # #                     subject=email_data['subject'],
# # #                     body=email_data['body'],
# # #                     received_at=datetime.now()
# # #                 )

# # #                 # email_data.delete()

# # #             return "Email processing completed successfully"
# # #         except Exception as e:
# # #             return f"Error processing emails: {str(e)}"
    
# # # @shared_task(bind=True, name="desis.apis.tasks.process_emails", ignore_result=True)
# # # def run_process_emails_periodically(self):
# # #     print("I am triggred")
# # #     process_emails.delay()

# # # run_process_emails_periodically.apply_async((), countdown=60)


# # # CELERY_BEAT_SCHEDULE = {
# # #     'process-emails-every-5-minutes': {
# # #         'task': 'desis.apis.tasks.process_emails',
# # #         'schedule': timedelta(minutes=5),  # Run every 5 minutes
# # #     },
# # # }



# # # apis/tasks.py
# # # apis/tasks.py

# # # apis/tasks.py

# from celery import shared_task,group,chain
# from .models import Email, MailExpense
# from datetime import datetime, timedelta
# import imaplib
# import email
# import re
# import html2text
# import json
# from .models import UserStatus
# import google.generativeai as genai
# import time
# from django.utils import timezone
# import os

# @shared_task
# def check_worker_status():
#     file_name = "example.txt"
#     with open(file_name, 'w') as file:
#         file.write("Hello, this is a new file created in Python!")


# # # @shared_task
# # # def process_emails():
# # #     # Fetching user credentials
# # #     users = UserStatus.objects.all()
# # #     tasks = []
# # #     for user in users:
# # #         tasks.append(process_emails.s(user.gmail, user.app_password))
# # #     group(*tasks)()
# # /*
# # @shared_task
# # def process_emails():
   
# #     # Function to connect to the IMAP server
# #     def connect_to_imap(username, password):
# #         mail = imaplib.IMAP4_SSL('imap.gmail.com')
# #         mail.login(username, password)
# #         return mail

# #     # Function to fetch emails from the inbox within the last 2 minutes
# #     def fetch_emails_within_last_two_minutes(mail):
# #         two_minutes_ago = datetime.now() - timedelta(minutes=2)
# #         date_two_minutes_ago = two_minutes_ago.strftime('%d-%b-%Y')
# #         mail.select('inbox')
# #         _, data = mail.search(None, f'(SINCE "{date_two_minutes_ago}")')
# #         email_ids = data[0].split()
# #         emails = []
# #         for email_id in email_ids:
# #             _, data = mail.fetch(email_id, '(RFC822)')
# #             emails.append((email_id, data[0][1]))
# #         return emails

# #     # Function to parse email content and extract relevant information
# #     def parse_email(email_content):
# #         msg = email.message_from_bytes(email_content)
# #         sender = msg['From']
# #         subject = msg['Subject']
# #         body = ""

# #         if msg.is_multipart():
# #             for part in msg.walk():
# #                 if part.get_content_type() == "text/plain":
# #                     body += part.get_payload(decode=True).decode()
# #         else:
# #             body = msg.get_payload(decode=True).decode()

# #         return {"sender": sender, "subject": subject, "body": body}

# #     # Function to identify order-related emails using regular expressions
# #     def identify_order_emails(emails):
# #         order_emails = []
# #         for email_id, email_content in emails:
# #             try:
# #                 con = parse_email(email_content)
# #                 if re.search(r'(order\s+(summary|confirmation)|order\s+placed)', con["subject"], re.IGNORECASE) or re.search(r'(order\s+(summary|confirmation)|order\s+placed)', con["body"], re.IGNORECASE):
# #                     order_emails.append((email_id, con))
# #             except:
# #                 pass
# #         return order_emails

# #     # Function to store emails in the Django model Email
# #     def store_emails_in_db(emails,user):
# #         for email_id, email_data in emails:
# #             Email.objects.create(
# #                 email_id=email_id,  # Save email_id to identify emails uniquely
# #                 user=user,
# #                 sender=email_data["sender"],
# #                 subject=email_data["subject"],
# #                 body=email_data["body"],
# #                 received_at=datetime.now()
# #             )

# #     # Function to process emails using Gemini
# #     def process_emails_with_gemini():
# #         # Configure Gemini connection (replace with your API key)
# #         genai.configure(api_key="AIzaSyCvKJkmaRe-mSDEiz-biZS-xT2jkjGY9RU")
# #         model = genai.GenerativeModel('gemini-pro')

# #         for email_data in Email.objects.filter(processed=False):  # Only process emails not marked as processed
          
# #             gemini_prompt = f'''
# #                 the Gemini will give me the user_id (same as given above) ,
# #                 Sender_platform (the ecommerce platform name from where the order has been place: can be decoded by the senders email) ,
# #                 sender_icon (a code to decode the e-commerce platform from the sender email and then in the table insert their respective icon) ,
# #                 order_id ( any id/number that is given in the email as an order id) ,
# #                 the product name ( identity the name of the product from the mail body if not identified any then save as ITEM) ,
# #                 category ( try to classify the type of product as in a category , like electronics ,clothes ,homeware etc, If the product name is ITEM or not able to classify the product then save as OTHER) ,
# #                 amount ( identify the total amount of the order from the email body, generally the max amount followed by the symbol Rs. ) ,
# #                 date/time ( date/time of the order placed) ,
# #                 status ( whether the order is confirmed, delivered, returned, also if the Gemini finds a email with same email order, then without adding a new row, only update this status )  ,
# #                 feedback ( if there is a link in the body asking the user to give the feedback , then upload that link in this column , if nothing is given then keep it empty )
# #                 '''

# #             response = model.generate_content(gemini_prompt,email_data=email_data)
# #             order_info = response.text.split("|")

# #             sender_platform = email_data.sender
# #             user_id = email_data.user_id  
# #             order_id = order_info[4]
# #             product_name = order_info[5]
# #             category = order_info[6]
# #             # Handle potential conversion errors for amount
# #             amount = order_info[7]
# #             date_time = order_info[8]
# #             status = order_info[9]
# #             feedback = order_info[10]

# #             # Store data in MailExpense model
# #             MailExpense.objects.create(
# #                 # user_id=user_id,
# #                 platform=sender_platform,
# #                 order_id=order_id,
# #                 item=product_name,
# #                 category=category,
# #                 amount=amount,
# #                 date_of_purchase=date_time,
# #                 status=status,
# #                 feedback=feedback
# #             )

# #             # Mark email as processed
# #             email_data.processed = True
# #             email_data.save()

# #     # Main function to process data and insert into the database

# #     def process_data_and_insert():
# #     # Fetching user credentials
# #         users = UserStatus.objects.all()
# #         for user in users:
# #             mail = connect_to_imap(user.gmail, user.app_password)
# #             emails = fetch_emails_within_last_two_minutes(mail)
# #             order_emails = identify_order_emails(emails)
# #             store_emails_in_db(order_emails)
# #             process_emails_with_gemini()

# #     return process_data_and_insert()




# # @shared_task(bind=True, name="desis.apis.tasks.process_emails", ignore_result=False)
# # def run_process_emails_periodically():
# #     print("something")
# #     process_emails()
# #     print("Scheduled task executed at:", timezone.now())

# # run_process_emails_periodically.apply_async((), countdown=60)


# # CELERY_BEAT_SCHEDULE = {
# #     'process-emails-every-5-minutes': {
# #         'task': 'desis.apis.tasks.process_emails',
# #         'schedule': timedelta(seconds=10),  # Run every 5 minutes
# #     },
# # }
