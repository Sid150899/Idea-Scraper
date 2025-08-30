import os
from dotenv import load_dotenv

# Load environment variables from .env file in the root directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Configuration class or variables
class Config:
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    CRAWL4AI_API_KEY = os.getenv('CRAWL4AI_API_KEY')
    DATABASE_URL = os.getenv('DATABASE_URL')
    MAX_PAGES = int(os.getenv('MAX_PAGES', 1))
    TIMEOUT = int(os.getenv('TIMEOUT', 60))
    
    # Supabase configuration
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    
    # Model configurations based on agentic hierarchy
    TOOL_MODEL = 'gemini-2.0-flash-001'      # For tools (third level)
    AGENT_MODEL = 'gemini-2.5-pro'            # For subagents and main agents (first and second level)

# Create a global config instance
config = Config()

# Function to get config instance
def get_config():
    return config