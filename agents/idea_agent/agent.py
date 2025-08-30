from google.adk.agents import SequentialAgent
from .subagents.scrape_agent.agent import root_agent as scrape_agent
from .subagents.idea_detailing_agent.agent import root_agent as idea_detailing_agent

# Simple sequential agent that runs scrape_agent first, then idea_detailing_agent
root_agent = SequentialAgent(
    name='idea_agent',
    description='A simple pipeline for extracting startup ideas from Reddit: first scrape, then analyze.',
    sub_agents=[scrape_agent, idea_detailing_agent],
)
