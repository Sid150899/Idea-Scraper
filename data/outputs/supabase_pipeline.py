#!/usr/bin/env python3
"""
Supabase Idea Extraction Pipeline
This script reads existing JSON files and saves the extracted ideas to Supabase
"""

import json
import sys
import os
import time
import requests
from datetime import datetime

# Import Supabase configuration from root config
try:
    # Get the absolute path to the root directory (two levels up from data/outputs/)
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sys.path.insert(0, root_dir)
    
    from config import config
    
    SUPABASE_URL = config.SUPABASE_URL
    SUPABASE_KEY = config.SUPABASE_KEY
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL or SUPABASE_KEY not found in config")
        
    print(f"✅ Found Supabase config: {SUPABASE_URL}")
    
except ImportError as e:
    print(f"❌ Failed to import config: {e}")
    print("   Please ensure config.py exists in the root directory")
    print(f"   Current working directory: {os.getcwd()}")
    print(f"   Script location: {os.path.abspath(__file__)}")
    print(f"   Root directory path: {root_dir if 'root_dir' in locals() else 'Not set'}")
    sys.exit(1)
except ValueError as e:
    print(f"❌ Config error: {e}")
    print("   Please check your .env file for SUPABASE_URL and SUPABASE_KEY")
    sys.exit(1)

# Table Configuration
TABLE_NAME = 'scraped_idea'  # Your existing table name

def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    try:
        import requests
        print("✅ requests available")
    except ImportError:
        print("❌ requests not available. Installing...")
        try:
            import subprocess
            subprocess.run([sys.executable, "-m", "pip", "install", "requests"], 
                         check=True, capture_output=True)
            print("✅ requests installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install requests: {e}")
            print("Please install manually: pip install requests")
            return False
    
    return True

def test_supabase_connection():
    """Test connection to Supabase using REST API"""
    print("\n🔌 Testing Supabase connection...")
    
    try:
        # Test connection by trying to fetch table info
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json'
        }
        
        # Try to get a sample row from the table
        test_url = f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}?select=*&limit=1"
        response = requests.get(test_url, headers=headers)
        
        if response.status_code == 200:
            print(f"✅ Connected to Supabase successfully")
            print(f"✅ Table '{TABLE_NAME}' is accessible")
            
            # Get table structure by looking at the response
            data = response.json()
            if data:
                sample_row = data[0] if isinstance(data, list) and data else {}
                print(f"📋 Table has {len(sample_row)} columns:")
                for col, value in sample_row.items():
                    col_type = type(value).__name__
                    print(f"   - {col}: {col_type}")
            else:
                print(f"📋 Table '{TABLE_NAME}' exists but is empty")
            
            return True
        else:
            print(f"❌ Failed to access table: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        print("\n💡 Please check your Supabase configuration:")
        print("   1. Verify SUPABASE_URL in your .env file")
        print("   2. Verify SUPABASE_KEY in your .env file")
        print("   3. Check your Supabase project settings")
        return False

def check_required_files():
    """Check if the required JSON files exist"""
    print("\n📁 Checking required files...")
    
    required_files = [
        "merged_ideas.json"
    ]
    
    missing_files = []
    for file in required_files:
        if os.path.exists(file):
            print(f"   ✅ {file}")
        else:
            print(f"   ❌ {file} (missing)")
            missing_files.append(file)
    
    if missing_files:
        print(f"\n❌ Missing required files: {', '.join(missing_files)}")
        print("💡 Please run the merge script first:")
        print("   python3 merge_responses.py")
        return False
    
    print("✅ All required files found")
    return True

def load_and_merge_data():
    """Load already merged data from merged_ideas.json"""
    print("\n🔗 Loading merged data from merged_ideas.json...")
    
    try:
        # Load the already merged ideas
        with open('merged_ideas.json', 'r', encoding='utf-8') as f:
            merged_data = json.load(f)
        
        # Extract the ideas array
        merged_ideas = merged_data.get('ideas', merged_data)
        
        print(f"📊 Loaded {len(merged_ideas)} merged ideas")
        print(f"📊 Total count: {merged_data.get('total_count', len(merged_ideas))}")
        print(f"📊 Matched count: {merged_data.get('matched_count', len(merged_ideas))}")
        
        return merged_ideas
        
    except Exception as e:
        print(f"❌ Error loading merged data: {e}")
        return None

def check_existing_ideas(headers):
    """Check for existing ideas in the database to avoid duplicates"""
    print("🔍 Checking for existing ideas to prevent duplicates...")
    
    try:
        # Query existing ideas to get their URLs and titles
        query_url = f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}?select=url,title&order=created_at.desc"
        response = requests.get(query_url, headers=headers)
        
        if response.status_code == 200:
            existing_data = response.json()
            existing_urls = set()
            existing_titles = set()
            
            for item in existing_data:
                if item.get('url'):
                    existing_urls.add(item['url'].lower().strip())
                if item.get('title'):
                    existing_titles.add(item['title'].lower().strip())
            
            print(f"📊 Found {len(existing_urls)} existing URLs and {len(existing_titles)} existing titles")
            return existing_urls, existing_titles
        else:
            print(f"⚠️  Could not fetch existing ideas: {response.status_code}")
            return set(), set()
            
    except Exception as e:
        print(f"⚠️  Error checking existing ideas: {e}")
        return set(), set()

def save_to_supabase(merged_ideas):
    """Save merged ideas to Supabase database"""
    print(f"\n💾 Saving {len(merged_ideas)} ideas to Supabase...")
    
    if not merged_ideas:
        print("❌ No ideas to save")
        return 0
    
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Check for existing ideas to prevent duplicates
    existing_urls, existing_titles = check_existing_ideas(headers)
    
    inserted_count = 0
    skipped_count = 0
    
    for i, idea in enumerate(merged_ideas):
        try:
            idea_title = idea.get('title', '')
            idea_url = idea.get('url', '')
            
            print(f"   📝 Processing idea {i+1}/{len(merged_ideas)}: {idea_title[:50]}...")
            
            # Check for duplicates by URL and title
            is_duplicate = False
            duplicate_reason = ""
            
            if idea_url and idea_url.lower().strip() in existing_urls:
                is_duplicate = True
                duplicate_reason = "URL already exists"
            elif idea_title and idea_title.lower().strip() in existing_titles:
                is_duplicate = True
                duplicate_reason = "Title already exists"
            
            if is_duplicate:
                print(f"   ⚠️  Skipping duplicate: {duplicate_reason}")
                skipped_count += 1
                continue
            
            # Prepare data for insertion
            insert_data = {
                "title": idea.get('title', ''),
                "url": idea.get('url', ''),
                "content": idea.get('content', ''),
                "evaluation_score": idea.get('evaluation_score', 0),
                "introduction": idea.get('introduction', ''),
                "implementation_plan": idea.get('implementation_plan', ''),
                "market_analysis": idea.get('market_analysis', ''),
                "user_comments": idea.get('user_comments', ''),
                "innovation": idea.get('innovation', 0),
                "quality": idea.get('quality', 0),
                "problem_significance": idea.get('problem_significance', 0),
                "engagement_score": idea.get('engagement_score', 0),
                "reasoning_behind_score": idea.get('reasoning_behind_score', ''),
                "advise_for_improvement": idea.get('advise_for_improvement', ''),
                "date_of_post": idea.get('date_of_post', ''),  # Use the date string directly
                "source_subreddit": idea.get('source_subreddit', ''),
                "created_at": idea.get('created_at') if idea.get('created_at') else datetime.now().isoformat(),
                "updated_at": idea.get('updated_at') if idea.get('updated_at') else datetime.now().isoformat()
            }
            
            # Insert using Supabase REST API
            insert_url = f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}"
            response = requests.post(insert_url, headers=headers, json=insert_data)
            
            if response.status_code in [200, 201]:
                try:
                    data = response.json()
                    if data and isinstance(data, list) and data:
                        idea_id = data[0].get('idea_id', 'unknown')
                        inserted_count += 1
                        print(f"   ✅ Inserted idea {idea_id}: {idea.get('title', 'Untitled')[:50]}...")
                    else:
                        print(f"   ✅ Inserted idea (no ID returned): {idea.get('title', 'Untitled')[:50]}...")
                        inserted_count += 1
                except Exception as json_error:
                    print(f"   ⚠️  Inserted but JSON parsing failed: {json_error}")
                    print(f"      Raw response: {response.text}")
                    inserted_count += 1
            else:
                print(f"   ❌ Supabase insertion failed: {response.status_code}")
                print(f"      Response: {response.text}")
                print(f"      Data: {insert_data}")
            
        except Exception as e:
            print(f"   ❌ Failed to insert idea: {e}")
            continue
    
    print(f"\n🎉 Successfully inserted {inserted_count} ideas into Supabase!")
    if skipped_count > 0:
        print(f"⚠️  Skipped {skipped_count} duplicate ideas")
    
    # Return the count of inserted ideas (0 is valid when all are duplicates)
    # Only return negative values for actual errors
    return inserted_count

def main():
    """Main execution function"""
    print("🚀 Supabase Idea Database Save")
    print("=" * 70)
    
    # Check dependencies
    if not check_dependencies():
        print("❌ Dependencies check failed. Exiting...")
        sys.exit(1)
    
    # Test Supabase connection
    if not test_supabase_connection():
        print("❌ Supabase connection failed. Please update SUPABASE_URL and SUPABASE_KEY in config. Exiting...")
        sys.exit(1)
    
    # Check required files
    if not check_required_files():
        print("❌ Required files missing. Exiting...")
        sys.exit(1)
    
    try:
        # Step 1: Load and merge data from existing JSON files
        merged_ideas = load_and_merge_data()
        if not merged_ideas:
            print("❌ Data loading/merging failed. Exiting...")
            sys.exit(1)
        
        # Step 2: Save to Supabase
        inserted_count = save_to_supabase(merged_ideas)
        
        # Check if the operation was successful
        if inserted_count < 0:  # Only fail if there was an actual error
            print("❌ Supabase insertion failed. Exiting...")
            sys.exit(1)
        elif inserted_count == 0:
            print("ℹ️  No new ideas were inserted (all were duplicates)")
        else:
            print(f"✅ Successfully inserted {inserted_count} new ideas")
        
        print("\n" + "=" * 70)
        if inserted_count > 0:
            print("🎉 SUPABASE SAVE COMPLETED SUCCESSFULLY!")
            print("=" * 70)
            print(f"📊 Total ideas processed: {len(merged_ideas)}")
            print(f"💾 New ideas saved to Supabase: {inserted_count}")
            print("\n✨ New startup ideas have been added to Supabase!")
        else:
            print("✅ SUPABASE DUPLICATE CHECK COMPLETED SUCCESSFULLY!")
            print("=" * 70)
            print(f"📊 Total ideas processed: {len(merged_ideas)}")
            print(f"ℹ️  All ideas were already in the database (no duplicates)")
        print("\n   You can view your ideas in your Supabase dashboard or create an interface.")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Process interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
