from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup
import json

app = Flask(__name__)

def check_tiktok_live_status(url):
    response = requests.get(url)
    
    if response.status_code != 200:
        return None
    
    soup = BeautifulSoup(response.content, 'html.parser')
    script_tag = soup.find('script', id='SIGI_STATE')
    
    if not script_tag:
        return None
    
    try:
        json_data = json.loads(script_tag.string)
    except json.JSONDecodeError:
        return None
    
    is_live = "LiveRoom" in json_data
    return is_live

@app.route('/tiktok-status-check', methods=['GET'])
def tiktok_status_check():
    url = request.args.get('url')
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    
    live_status = check_tiktok_live_status(url)
    if live_status is None:
        return jsonify({"error": "Could not determine the live status"}), 500
    
    return jsonify({"is_live": live_status})

if __name__ == '__main__':
    app.run(debug=True)
