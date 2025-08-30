"""
Database service for managing scraped ideas and user data
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from supabase import Client
from .supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

class ScrapedIdeaService:
    """
    Service for managing scraped ideas in the database
    """
    
    def __init__(self):
        self.client: Client = get_supabase_client()
    
    def insert_scraped_idea(self, idea_data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Insert a single scraped idea
        
        Args:
            idea_data: Dictionary containing idea data
            user_id: Optional user ID to associate with the idea
            
        Returns:
            Inserted idea data with ID
        """
        try:
            # Prepare data for insertion
            insert_data = {
                'title': idea_data.get('title'),
                'url': idea_data.get('url'),
                'content': idea_data.get('content'),
                'source_subreddit': idea_data.get('source_subreddit'),
                'date_of_post': idea_data.get('date_of_post'),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Add user_id if provided
            if user_id:
                insert_data['user_id'] = user_id
            
            # Insert into database
            response = self.client.table('scraped_idea').insert(insert_data).execute()
            
            if response.data:
                logger.info(f"Successfully inserted scraped idea: {idea_data.get('title', 'Unknown')}")
                return response.data[0]
            else:
                raise Exception("No data returned from insert operation")
                
        except Exception as e:
            logger.error(f"Failed to insert scraped idea: {e}")
            raise
    
    def insert_multiple_scraped_ideas(self, ideas: List[Dict[str, Any]], user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Insert multiple scraped ideas in bulk
        
        Args:
            ideas: List of idea dictionaries
            user_id: Optional user ID to associate with all ideas
            
        Returns:
            List of inserted idea data with IDs
        """
        try:
            # Prepare data for bulk insertion
            insert_data = []
            for idea in ideas:
                idea_data = {
                    'title': idea.get('title'),
                    'url': idea.get('url'),
                    'content': idea.get('content'),
                    'source_subreddit': idea.get('source_subreddit'),
                    'date_of_post': idea.get('date_of_post'),
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }
                
                if user_id:
                    idea_data['user_id'] = user_id
                
                insert_data.append(idea_data)
            
            # Bulk insert
            response = self.client.table('scraped_idea').insert(insert_data).execute()
            
            if response.data:
                logger.info(f"Successfully inserted {len(response.data)} scraped ideas")
                return response.data
            else:
                raise Exception("No data returned from bulk insert operation")
                
        except Exception as e:
            logger.error(f"Failed to insert multiple scraped ideas: {e}")
            raise
    
    def update_idea_details(self, idea_id: str, idea_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an idea with detailed analysis from the idea detailing agent
        
        Args:
            idea_id: ID of the idea to update
            idea_details: Dictionary containing detailed analysis
            
        Returns:
            Updated idea data
        """
        try:
            # Prepare update data
            update_data = {
                'introduction': idea_details.get('introduction'),
                'implementation_plan': idea_details.get('implementation_plan'),
                'market_analysis': idea_details.get('market_analysis'),
                'user_comments': idea_details.get('user_comments'),
                'innovation': idea_details.get('evaluation_scores', [{}])[0].get('innovation') if idea_details.get('evaluation_scores') else None,
                'quality': idea_details.get('evaluation_scores', [{}])[0].get('quality') if idea_details.get('evaluation_scores') else None,
                'problem_significance': idea_details.get('evaluation_scores', [{}])[0].get('problem_significance') if idea_details.get('evaluation_scores') else None,
                'engagement_score': idea_details.get('evaluation_scores', [{}])[0].get('engagement_score') if idea_details.get('evaluation_scores') else None,
                'reasoning_behind_score': idea_details.get('reasoning_behind_scores'),
                'advise_for_improvement': idea_details.get('advice_for_improvement'),
                'updated_at': datetime.now().isoformat()
            }
            
            # Remove None values
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            # Update in database
            response = self.client.table('scraped_idea').update(update_data).eq('idea_id', idea_id).execute()
            
            if response.data:
                logger.info(f"Successfully updated idea details for idea ID: {idea_id}")
                return response.data[0]
            else:
                raise Exception("No data returned from update operation")
                
        except Exception as e:
            logger.error(f"Failed to update idea details: {e}")
            raise
    
    def get_idea_by_url(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Get an idea by its URL
        
        Args:
            url: URL of the idea
            
        Returns:
            Idea data if found, None otherwise
        """
        try:
            response = self.client.table('scraped_idea').select('*').eq('url', url).execute()
            
            if response.data:
                return response.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Failed to get idea by URL: {e}")
            return None
    
    def get_all_ideas(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get all ideas with optional limit
        
        Args:
            limit: Maximum number of ideas to return
            
        Returns:
            List of idea data
        """
        try:
            response = self.client.table('scraped_idea').select('*').order('created_at', desc=True).limit(limit).execute()
            return response.data or []
            
        except Exception as e:
            logger.error(f"Failed to get all ideas: {e}")
            return []
    
    def search_ideas(self, query: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Search ideas using full-text search
        
        Args:
            query: Search query
            limit: Maximum number of results
            
        Returns:
            List of matching ideas
        """
        try:
            # Use the custom search function (fallback to basic search if function doesn't exist)
            response = self.client.rpc('search_scraped_ideas', {'search_query': query, 'limit_count': limit}).execute()
            return response.data or []
        except:
            # Fallback to basic search if custom function doesn't exist
            response = self.client.table('scraped_idea').select('*').ilike('title', f'%{query}%').limit(limit).execute()
            return response.data or []

class UserService:
    """
    Service for managing user data
    """
    
    def __init__(self):
        self.client: Client = get_supabase_client()
    
    def update_last_session_refresh(self, user_id: str) -> bool:
        """
        Update the last session refresh timestamp for a user
        
        Args:
            user_id: ID of the user to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            update_data = {
                'last_session_refresh': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            response = self.client.table('User').update(update_data).eq('user_id', user_id).execute()
            
            if response.data:
                logger.info(f"Successfully updated last session refresh for user: {user_id}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Failed to update last session refresh: {e}")
            return False
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user by ID
        
        Args:
            user_id: ID of the user
            
        Returns:
            User data if found, None otherwise
        """
        try:
            response = self.client.table('User').select('*').eq('user_id', user_id).execute()
            
            if response.data:
                return response.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Failed to get user by ID: {e}")
            return None
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get user by email
        
        Args:
            email: Email of the user
            
        Returns:
            User data if found, None otherwise
        """
        try:
            response = self.client.table('User').select('*').eq('email', email).execute()
            
            if response.data:
                return response.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Failed to get user by email: {e}")
            return None
    
    def create_user(self, user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a new user
        
        Args:
            user_data: Dictionary containing user data (first_name, last_name, email, password_hash)
            
        Returns:
            Created user data if successful, None otherwise
        """
        try:
            # Add timestamps
            user_data['created_at'] = datetime.now().isoformat()
            user_data['updated_at'] = datetime.now().isoformat()
            user_data['last_session_refresh'] = datetime.now().isoformat()
            
            response = self.client.table('User').insert(user_data).execute()
            
            if response.data:
                logger.info(f"Successfully created user: {user_data.get('email')}")
                return response.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Failed to create user: {e}")
            return None

# Global service instances
_scraped_idea_service: Optional[ScrapedIdeaService] = None
_user_service: Optional[UserService] = None

def get_scraped_idea_service() -> ScrapedIdeaService:
    """Get the scraped idea service instance"""
    global _scraped_idea_service
    if _scraped_idea_service is None:
        _scraped_idea_service = ScrapedIdeaService()
    return _scraped_idea_service

def get_user_service() -> UserService:
    """Get the user service instance"""
    global _user_service
    if _user_service is None:
        _user_service = UserService()
    return _user_service
