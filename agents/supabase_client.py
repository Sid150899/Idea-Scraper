"""
Supabase client for database operations
"""

import os
import logging
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from config import config

logger = logging.getLogger(__name__)

# Global Supabase client instance
_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """
    Get or create a Supabase client instance
    """
    global _supabase_client
    
    if _supabase_client is None:
        if not config.SUPABASE_URL or not config.SUPABASE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
        
        try:
            _supabase_client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise
    
    return _supabase_client

def test_connection() -> bool:
    """
    Test the Supabase connection
    """
    try:
        client = get_supabase_client()
        # Try to query the User table to test connection
        response = client.table("User").select("user_id").limit(1).execute()
        logger.info("Supabase connection test successful")
        return True
    except Exception as e:
        logger.error(f"Supabase connection test failed: {e}")
        return False

def close_connection():
    """
    Close the Supabase connection
    """
    global _supabase_client
    if _supabase_client:
        _supabase_client = None
        logger.info("Supabase connection closed")

# Convenience function for direct access
def supabase_client() -> Client:
    """
    Get the Supabase client directly
    """
    return get_supabase_client()
