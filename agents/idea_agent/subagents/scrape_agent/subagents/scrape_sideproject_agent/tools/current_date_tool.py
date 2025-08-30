#!/usr/bin/env python3
"""
Simple current date tool function.
"""

from datetime import datetime

def get_current_date() -> str:
    """
    Get the current date in YYYY-MM-DD format.
    
    Returns:
        str: Current date in YYYY-MM-DD format
    """
    return datetime.now().strftime("%Y-%m-%d")

def get_current_timestamp() -> float:
    """
    Get the current Unix timestamp.
    
    Returns:
        float: Current Unix timestamp
    """
    return datetime.now().timestamp()
