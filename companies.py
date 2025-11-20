import time
import json
import csv
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup


URL = "https://eemis.mglsd.go.ug/companies"


def init_driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--window-size=1920,1080")

    driver = webdriver.Chrome(
        ChromeDriverManager().install(),
        options=chrome_options
    )
    return driver


def scroll_to_bottom(driver):
    """Scrolls until no more content loads."""
    last_height = driver.execute_script("return document.body.scrollHeight")

    while True:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)

        new_height = driver.execute_script("return document.body.scrollHeight")

        if new_height == last_height:
            break
        last_height = new_height


def parse_companies(html):
    soup = BeautifulSoup(html, "html.parser")
    companies = []

    cards = soup.select(".company-card, .card, .col-md-4")  # flexible for future layout changes

    for card in cards:
        text = card.get_text(separator=" ", strip=True)

        company = {}

        # Extract fields using keywords — works even with messy HTML
        fields = [
            ("name", ["Company Name", "Name"]),
            ("email", ["Email"]),
            ("phone", ["Phone", "Tel"]),
            ("address", ["Address", "Location"]),
            ("license", ["License"]),
            ("status", ["Status"]),
        ]

        for key, words in fields:
            for w in words:
                if w in text:
                    try:
                        company[key] = text.split(w)[1].split(":")[1].split("  ")[0].strip()
                    except:
                        pass

        if "name" in company:
            companies.append(company)

    return companies


def save_json(companies):
    with open("companies.json", "w", encoding="utf-8") as f:
        json.dump(companies, f, indent=4, ensure_ascii=False)


def save_csv(companies):
    if not companies:
        print("No companies to save.")
        return

    keys = companies[0].keys()
    with open("companies.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(companies)


def main():
    print("Launching headless browser...")
    driver = init_driver()
    driver.get(URL)
    time.sleep(4)

    print("Scrolling to load all companies...")
    scroll_to_bottom(driver)

    print("Extracting company cards...")
    html = driver.page_source
    companies = parse_companies(html)

    print(f"Total companies scraped: {len(companies)}")

    save_json(companies)
    save_csv(companies)

    driver.quit()
    print("Saved companies.json and companies.csv")


if __name__ == "__main__":
    main()
