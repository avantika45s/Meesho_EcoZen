import pandas as pd
import requests
from bs4 import BeautifulSoup
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'}
def amazon(name):
    try:
        global amazon
        name1 = name.replace(" ","-")
        name2 = name.replace(" ","+")
        amazon=f'https://www.amazon.in/{name1}/s?k={name2}'
        res = requests.get(f'https://www.amazon.in/{name1}/s?k={name2}',headers=headers)
        # print("\nSearching in amazon:")
        soup = BeautifulSoup(res.text,'lxml')
        amazon_page = soup.select('.a-color-base.a-text-normal')
        amazon_page_length = int(len(amazon_page))
        for i in range(0,amazon_page_length):
            name = name.upper()
            amazon_name = soup.select('.a-color-base.a-text-normal')[i].getText().strip().upper()
            if name in amazon_name[0:20]:
                amazon_name = soup.select('.a-color-base.a-text-normal')[i].getText().strip().upper()
                amazon_price = soup.select('.a-price-whole')[i].getText().strip().upper()
                # print("Amazon:")
                # print(amazon_name)
                # print("₹"+amazon_price)
                # print("-----------------------")
                break
            else:
                i+=1
                i=int(i)
                if i==amazon_page_length:
                    print("amazon : No product found!")
                    print("-----------------------")
                    amazon_price = "0"
                    break
        return amazon_price
    except:
        print("amazon: No product found!")
        print("-----------------------")
        amazon_price = "0"
    return amazon_price

# name = input("product:\n")
# amprice = amazon(name)

# print("₹"+amprice)