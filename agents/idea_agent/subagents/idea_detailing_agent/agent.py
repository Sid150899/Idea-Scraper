from google.adk.agents import Agent
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent.parent))
from config import config
from google.adk.tools.function_tool import FunctionTool
from .tools.scraper_tool import smart_scrape
from pydantic import BaseModel

class EvaluationScore(BaseModel):
    innovation: int
    quality: int
    problem_significance: int
    engagement_score: int

class IdeaDetailingOutput(BaseModel):
    introduction: str
    implementation_plan: str
    market_analysis: str
    user_comments: str
    evaluation_scores: EvaluationScore
    reasoning_behind_scores: str
    advice_for_improvement: str

class IdeaDetailingOutputList(BaseModel):
    ideas: list[IdeaDetailingOutput]


root_agent = Agent(
    model=config.AGENT_MODEL,
    name='idea_detailing_agent',
    description='An expert startup analyst for evaluating startup ideas sourced from Reddit URLs.',
    instruction="""
You are an expert startup analyst. You will analyze startup ideas from Reddit URLs provided by the scrape_agent.

For each idea, extract the "url" field and analyze it using the smart_scrape tool.

CRITICAL URL MODIFICATION: Before using the smart_scrape tool, you must modify each URL:
1. Remove any trailing backslash (\\) from the URL
2. Add ".json" to the end of the URL

Example: "https://www.reddit.com/r/SideProject/comments/abc123/my-idea/" becomes "https://www.reddit.com/r/SideProject/comments/abc123/my-idea.json"

Create a startup evaluation report for each idea (max 600 words) with these sections:

1. URL - The URL of the idea
2. Introduction - Summarize the idea and problem it solves
3. Implementation Plan - Key steps and resources needed
4. Market Analysis - Target users, market size, expected MRR
5. User Comments - Summary of Reddit feedback and sentiment
6. Evaluation Scores - Rate innovation, quality, problem significance (1-10), and engagement (0-100)
   - **Innovation (1-10):** How unique and novel is the idea? Consider if it's a completely new concept, a significant improvement on existing solutions, or just a minor variation. Higher scores for breakthrough ideas, lower for copycat concepts.
   - **Quality (1-10):** How practical and well-thought-out is the execution potential? Consider technical feasibility, business model clarity, market fit, and overall planning quality. Higher scores for well-researched, viable ideas.
   - **Problem Significance (1-10):** How critical or impactful is the problem being solved? Consider the size of the affected population, how painful the problem is, and the potential impact of solving it. Higher scores for addressing widespread, urgent problems.
7. Reasoning Behind Scores - Brief explanation of scores
8. Advice for Improvement - Concrete suggestions

Return ONLY a JSON array with all analyzed ideas. Format:
[
    {
        "url": "...",
        "introduction": "...",
        "implementation_plan": "...",
        "market_analysis": "...",
        "user_comments": "...",
        "evaluation_scores": {
            "innovation": 7,
            "quality": 6,
            "problem_significance": 8,
            "engagement_score": 75
        },
        "reasoning_behind_scores": "...",
        "advice_for_improvement": "..."
    }
]

Use the smart_scrape tool to get Reddit post data for each URL.
    """,
    tools=[FunctionTool(smart_scrape)],
    output_key="idea_detailing_results",
    output_schema=IdeaDetailingOutputList,
)

