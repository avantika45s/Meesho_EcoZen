import pandas as pd
import requests
from bs4 import BeautifulSoup

def fl(name):
    if name is None:
        print("No product name provided")
        return "0"
    prices = []
    name1 = name.replace(" ","+")   #iphone x  -> iphone+x
    furl = f"https://www.flipkart.com/search?q={name1}&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off"
    r = requests.get(furl)   
    soup = BeautifulSoup(r.text, "lxml")

    price = soup.find_all("div", class_="_30jeq3 _1_WHN1")
    for i in price:
        name = i.text
        prices.append(name)
    
    if not prices:
        price2 = soup.find_all("div", class_="_30jeq3")
        for i in price2:
            name2 = i.text
            prices.append(name2)

    if not prices:
        print("No product found")
        return "0"
    print("flipkart: ",prices[0]);
    return prices[0]

# name = input("product:\n")

# fprice = fl(name)

# print(fprice)