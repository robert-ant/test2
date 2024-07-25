import requests
from bs4 import BeautifulSoup
import json

def check_tiktok_live_status(url):
    response = requests.get(url)
    
    if response.status_code != 200:
        print(f"Failed to retrieve the page. Status code: {response.status_code}")
        return None
    
    soup = BeautifulSoup(response.content, 'html.parser')
    script_tag = soup.find('script', id='SIGI_STATE')
    
    if not script_tag:
        print("Script tag with id 'SIGI_STATE' not found.")
        return None
    
    try:
        json_data = json.loads(script_tag.string)
    except json.JSONDecodeError:
        print("Failed to parse JSON content.")
        return None
    
    is_live = "LiveRoom" in json_data
    return is_live

# List of TikTok user URLs
tiktok_urls = [
    "https://www.tiktok.com/@nickeh30/live",
    # Add more TikTok live URLs here
]

live_users = []
offline_users = []

for url in tiktok_urls:
    live_status = check_tiktok_live_status(url)
    if live_status is not None:
        username = url.split('@')[1].split('/')[0]  # Extract username from URL
        if live_status:
            live_users.append(username)
        else:
            offline_users.append(username)

print("Live users:", live_users)
print("Offline users:", offline_users)