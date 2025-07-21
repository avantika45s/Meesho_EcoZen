# EcoZen – Smart Shopping, Greener Living

**EcoZen** is a powerful Chrome extension built using Django that transforms your shopping experience into a smarter, more sustainable journey. It combines financial tracking, AI-driven insights, and eco-conscious recommendations into one unified platform.

---

## Key Features

- **Real‑Time Savings Tracking**
  A gamified dashboard that updates your progress toward savings goals live as you spend.

-**Transaction‑Reminder Extension**
A Chrome extension button that logs your current purchase with one click—no manual entry needed.

-**ChatBot Integration**
An AI-powered chat interface for checking expenses, goal status, and receiving personalized tips.

-**Optimal Purchase Suggestions**
Side-by-side price comparisons across platforms like Amazon and Flipkart to help you find the best deal instantly.

-**Price Prediction**
Forecasts when a product's price will drop so you can buy at the perfect time.

-**Budget Review & Goal Tracking**
A summary view that compares your actual spending with your targets to keep you on track.

-**Eco‑Score & Sustainable Alternatives**
Rates a product's environmental impact and recommends greener, more sustainable options.

-**Auto‑Sizing with Computer Vision**
A “Find My Size” tool that uses your selfie to suggest perfectly fitting clothes—no more guesswork.

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript (Chrome Extension APIs)
- **Backend:** Django (Python)
- **Database:** MySQL, MySQL Workbench (You can also use MySqlLite)
- **API Keys:** OpenAI, Gemini
- **Terminal** Ubuntu via WSL or any CLI

---

## 🚀 Getting Started

### Prerequisites

- Python 3.x
- Google Chrome
- Django
- VS Code
- WSL (Any CLI)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/avantika45s/Meesho_EcoZen.git

   ```
2. **Install All the dependencies**

   pip install django
   
   pip install lxml

   pip install beautifulsoup4

   pip install openai

   pip install cryptography

   pip install google-generativeai

   pip install -U django-celery-beat

   pip install transformers

   pip install jwt

   pip install pandas

   pip install pymysql

   pip install google-auth

   pip install djangorestframework

   pip install scikit-learn

   pip install grpcio

   pip install django-cors-headers


4. **Add your Credentials**

    If you're using MySQL and MySQL Workbench, update the DATABASES configuration in EcoZen/settings.py with your MySQL Workbench credentials.
    Alternatively, you can use SQLite within your WSL environment or any command-line interface.

    Also, make sure to add your own API keys for services like OpenAI, Gemini, and RapidAPI and replace them with you API.


5. **Load the extension**
   To load EcoZen into your Chrome browser from the local directory, follow these steps:

    1. Open Extension Management Page
       Open Google Chrome and go to: chrome://extensions/

    2. Enable Developer Mode
       Toggle the "Developer mode" switch in the top-right corner of the page.

    3. Load the Extension
       Click “Load unpacked”
       Navigate to the directory where you cloned/downloaded the project
       Select the folder containing the extension files (typically the /extension folder)

    4. Confirm Installation
       After loading, the EcoZen extension should appear in the list of installed extensions.
       Ensure it is enabled using the toggle switch next to its name.

    5. Test the Extension
       Once enabled, the extension activates on popular e-commerce platforms.
       

6. **Start Django Server**

   
       python manage.py makemigrations

       python manage.py migrate

       python manage.py runserver


7. **Devtunnel Setup Commands** (If you want to generate a live link)
       Install the Remote - Tunnels extension by Microsoft in VS Code.

       Start your Django server locally (usually with python manage.py runserver).

       Press Ctrl + Shift + P to open the Command Palette.

       Search for and select “Dev Tunnels: Turn on Tunnel Access”.

       You’ll be prompted to sign in with your GitHub or Microsoft account.

       Once signed in, go to the Ports panel in VS Code (usually in the bottom panel).

       Click "Forward a Port" and add the port your Django server is running on (default is 8000).

       After adding the port, you’ll see a public HTTPS link next to it — that is your Dev Tunnel URL.

       Click on the link to open your Django app in the browser via the tunnel.




