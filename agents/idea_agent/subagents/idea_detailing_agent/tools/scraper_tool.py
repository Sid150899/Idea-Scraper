#!/usr/bin/env python3
"""
Simple scraper tool function for scraping Reddit JSON data and using crawl4ai.
"""

import requests
import json
from datetime import datetime
from typing import Dict, Any, Union
from config import config

def scrape_reddit_json(url: str) -> Union[str, Dict[str, Any]]:
    """
    Scrape Reddit JSON data directly from their JSON endpoints.

    Args:
        url (str): The Reddit JSON URL to fetch

    Returns:
        str: A JSON string containing the fetched content with status and result
    """
    try:
        # Headers to mimic a real browser request
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        }

        # Make direct request to Reddit JSON endpoint
        response = requests.get(url, headers=headers, timeout=config.TIMEOUT)

        if response.status_code == 200:
            # Parse JSON response
            result = response.json()
            response_data = {
                "status": "success",
                "error_message": None,
                "result": {
                    "type": "reddit_json",
                    "data": result,
                    "url": url,
                    "timestamp": datetime.now().isoformat()
                }
            }
            # Return as JSON string instead of dict
            return json.dumps(response_data, indent=2)
        else:
            error_data = {
                "status": "error",
                "error_message": f"HTTP {response.status_code}: {response.text}",
                "result": None
            }
            return json.dumps(error_data, indent=2)

    except Exception as e:
        error_data = {
            "status": "error",
            "error_message": str(e),
            "result": None
        }
        return json.dumps(error_data, indent=2)


def smart_scrape(url: str) -> str:
    """
    Intelligently choose the appropriate scraping method based on the URL.

    Args:
        url (str): The URL to scrape

    Returns:
        str: A JSON string containing the scraped content with status and result
    """
    # Check if it's a Reddit JSON endpoint
    if "reddit.com" in url and url.endswith(".json"):
        return scrape_reddit_json(url)
    else:
        # For now, just return error for non-Reddit URLs
        error_data = {
            "status": "error",
            "error_message": "Only Reddit JSON URLs are supported",
            "result": None
        }
        return json.dumps(error_data, indent=2)
