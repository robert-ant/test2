import logging
from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup
import json

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.DEBUG)

def check_tiktok_live_status(url):
    response = requests.get(url)
    logging.debug(f"Fetching TikTok URL: {url}")
    
    if response.status_code != 200:
        logging.error(f"Failed to fetch TikTok page, status code: {response.status_code}")
        return None
    
    soup = BeautifulSoup(response.content, 'html.parser')
    script_tag = soup.find('script', id='SIGI_STATE')
    
    if not script_tag:
        logging.error("SIGI_STATE script tag not found")
        return None
    
    try:
        json_data = json.loads(script_tag.string)
        logging.debug(f"JSON data parsed successfully: {json_data}")
    except json.JSONDecodeError as e:
        logging.error(f"JSON decode error: {e}")
        return None
    
    is_live = "LiveRoom" in json_data
    logging.debug(f"Live status for {url}: {is_live}")
    return is_live

@app.route('/tiktok-status-check', methods=['GET'])
def tiktok_status_check():
    url = request.args.get('url')
    if not url:
        logging.error("No URL provided")
        return jsonify({"error": "No URL provided"}), 400
    
    live_status = check_tiktok_live_status(url)
    if live_status is None:
        logging.error("Could not determine the live status")
        return jsonify({"error": "Could not determine the live status"}), 500
    
    return jsonify({"is_live": live_status})

if __name__ == '__main__':
    app.run(debug=True)