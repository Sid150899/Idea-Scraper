#!/usr/bin/env python3
"""
Simple ADK Text Extractor - Just gets the raw text response
"""

from google.adk.agents import Agent
from datetime import datetime
import requests
import json
from typing import Dict, Any
from google.adk.tools.agent_tool import AgentTool
from pydantic import BaseModel
# Import config from root level
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent.parent))
from config import config

from .subagents.scrape_cofounder_agent.agent import root_agent as scrape_cofounder_agent
from .subagents.scrape_saas_agent.agent import root_agent as scrape_saas_agent
from .subagents.scrape_businessideas_agent.agent import root_agent as scrape_businessideas_agent
from .subagents.scrape_startupideas_agent.agent import root_agent as scrape_startupideas_agent
from .subagents.scrape_sideproject_agent.agent import root_agent as scrape_sideproject_agent    

class ScrapeAgentOutput(BaseModel):
    title: str
    url: str
    content: str
    date_of_post: str
    source_subreddit: str
    last_refreshed: str

class ScrapeAgentOutputList(BaseModel):
    ideas: list[ScrapeAgentOutput]

def current_date_time() -> str:
    """
    Get the current date and time.
    """
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

cofounder_tool = AgentTool(agent=scrape_cofounder_agent)
saas_tool = AgentTool(agent=scrape_saas_agent)
businessideas_tool = AgentTool(agent=scrape_businessideas_agent)
startupideas_tool = AgentTool(agent=scrape_startupideas_agent)
sideproject_tool = AgentTool(agent=scrape_sideproject_agent)

# Map subagent names to subreddit names for proper categorization
subagent_subreddit_map = {
    "scrape_cofounder_agent": "cofounder",
    "scrape_saas_agent": "saas",
    "scrape_businessideas_agent": "businessideas",
    "scrape_startupideas_agent": "startupideas",
    "scrape_sideproject_agent": "sideproject"
}



merge_agent = Agent(
    name="scrape_agent",
    model=config.AGENT_MODEL,
    description="Merge the results of the subagents into a single list with duplicate prevention",
    instruction="""
    You are a merge agent that combines results from multiple scraping subagents. When the user asks for a specific subreddit, you must only return results from that subreddit. Otherwise, you must return results from all subreddits.

    You receive JSON arrays from each subagent and must merge them into a single JSON array.

    Your task is to:
    1. Collect all JSON arrays from the subagents. Use the tools provided to scrape the subreddits.
    2. Combine them into a single list
    3. Ensure each item has all required fields
    4. Add the "last_refreshed" timestamp and "source_subreddit" if missing

    For each idea, ensure it has these fields:
    - title: Title for the project
    - url: URL of the post (used for deduplication)
    - content: Content of the post in 1-2 paragraphs
    - date_of_post: Date of the post
    - source_subreddit: Source subreddit of the post (add based on the subagent)
    - last_refreshed: Current timestamp when scraped. Use the current date tool to get the current date.

    CRITICAL: Return ONLY the JSON array, no additional text. Format:
    [
        {
            "title": "AI-Powered Image Upscaling Tool",
            "url": "https://www.reddit.com/r/SideProject/comments/...",
            "content": "A new tool that automatically upscales images...",
            "date_of_post": "2025-08-23",
            "source_subreddit": "r/SideProject",
            "last_refreshed": "2024-08-23T12:01:23.456789Z"
        }
    ]

    You have the following tools:
    - current_date_time: Get the current date and time.
    - cofounder_tool: Scrape the cofounder subreddit.
    - saas_tool: Scrape the saas subreddit.
    - businessideas_tool: Scrape the businessideas subreddit.
    - startupideas_tool: Scrape the startupideas subreddit.
    - sideproject_tool: Scrape the sideproject subreddit.

    """,
    output_key="merged_results",
    tools=[cofounder_tool, saas_tool, businessideas_tool, startupideas_tool, sideproject_tool, current_date_time],
    output_schema=ScrapeAgentOutputList,
)

root_agent = merge_agent
