from google.adk.agents import Agent
from google.adk.tools.function_tool import FunctionTool
from .tools.scraper_tool import smart_scrape
from .tools.current_date_tool import get_current_date
from datetime import datetime
import requests
import json
from typing import Dict, Any

# Import config from root level
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent.parent.parent.parent))
from config import config

root_agent = Agent(
    model=config.AGENT_MODEL,
    name='scrape_businessideas_agent',
    description='A helpful assistant for user questions with web crawling capabilities.',
    instruction="""
    CRITICAL: You MUST follow these steps EXACTLY in order. Do NOT skip any step.

    STEP 1 - SCRAPE REDDIT DATA (MANDATORY):
    - You MUST call the smart_scrape function with URL: "https://www.reddit.com/r/businessideas.json"
    - Wait for the scraping results before proceeding
    - If scraping fails, return an error message
    - Do NOT proceed without successful scraping results

    STEP 2 - GET CURRENT DATE (MANDATORY):
    - Call the get_current_date function to get the current date
    - Use this date for filtering posts

    STEP 3 - PROCESS SCRAPED DATA (MANDATORY):
    - You MUST use ONLY the data returned from the smart_scrape function
    - Do NOT generate fake content or URLs
    - The scraped data will have this structure:
      - result -> data -> data -> children -> array of posts
      - Each post has a "data" object with post information

    STEP 4 - FILTER POSTS:
    - Filter posts that are from current date or previous day
    - Filter posts that are about ideas people are working on (not advisory posts)
    - Use ONLY posts from the scraped data

    STEP 5 - CONSTRUCT URLs CORRECTLY (MANDATORY):
    - For each post, take the "permalink" field (e.g., "/r/businessideas/comments/abc123/...")
    - Add "https://www.reddit.com" to the beginning
    - Final URL format: "https://www.reddit.com" + permalink
    - Do NOT use the "url" field directly
    - Do NOT generate fake URLs

    STEP 6 - RETURN RESULTS:
    For each filtered post, return:
    - title: Use the actual title from scraped data and create a title for the project such that it is a good title for the idea.
    - url: Use the correctly constructed Reddit URL from permalink
    - content: Use the actual "selftext" content from scraped data. Create a summary for the content in 1-2 paragraphs such that you are advertising the project.
    - date: Convert "created_utc" timestamp to readable date

    IMPORTANT RULES:
    - NEVER generate fake content or URLs
    - ALWAYS use data from the smart_scrape function results
    - If no posts are found, return empty list: []
    - If scraping fails, return error message
    - Follow the exact workflow above - no shortcuts

    You can use the following tools:
    - smart_scrape: MUST be called first to get Reddit data
    - get_current_date: MUST be called to get current date

    """,
    tools=[FunctionTool(smart_scrape), FunctionTool(get_current_date)],
    output_key="businessideas_results",
)
