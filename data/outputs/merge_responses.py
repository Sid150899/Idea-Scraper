#!/usr/bin/env python3
"""
Response Merging Script
This script merges scrape agent and idea detailing agent responses into single JSON objects
"""

import json
import sys
import os
from datetime import datetime
from difflib import SequenceMatcher
import re


def extract_source_subreddit(url):
    """Extract source subreddit from Reddit URL"""
    if not url:
        return "Unknown"
    
    # Pattern to match Reddit URLs and extract subreddit
    # Matches: https://www.reddit.com/r/SUBREDDIT_NAME/comments/...
    reddit_pattern = r'https?://(?:www\.)?reddit\.com/r/([^/]+)/'
    
    match = re.search(reddit_pattern, url)
    if match:
        subreddit = match.group(1)
        return f"r/{subreddit}"
    
    # If it's not a Reddit URL, return the domain or "Unknown"
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        if parsed.netloc:
            return parsed.netloc
        else:
            return "Unknown"
    except:
        return "Unknown"

def normalize_title(title):
    """Normalize title by removing special characters and converting to lowercase"""
    if not title:
        return ""
    # Remove special characters, keep only alphanumeric and spaces
    normalized = re.sub(r'[^a-zA-Z0-9\s]', '', title.lower())
    # Remove extra whitespace
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    return normalized

def calculate_title_similarity(title1, title2):
    """Calculate similarity between two titles using multiple methods"""
    if not title1 or not title2:
        return 0.0
    
    # Normalize both titles
    norm1 = normalize_title(title1)
    norm2 = normalize_title(title2)
    
    if not norm1 or not norm2:
        return 0.0
    
    # Method 1: Sequence matcher (overall similarity)
    seq_similarity = SequenceMatcher(None, norm1, norm2).ratio()
    
    # Method 2: Word overlap (how many words are common)
    words1 = set(norm1.split())
    words2 = set(norm2.split())
    
    if not words1 or not words2:
        word_similarity = 0.0
    else:
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        word_similarity = len(intersection) / len(union) if union else 0.0
    
    # Method 3: Check if one title contains the other (partial match)
    contains_match = 0.0
    if len(norm1) > 10 and len(norm2) > 10:  # Only for substantial titles
        if norm1 in norm2 or norm2 in norm1:
            contains_match = 0.8
    
    # Combine all methods with weights
    final_similarity = (seq_similarity * 0.4 + word_similarity * 0.4 + contains_match * 0.2)
    
    return round(final_similarity, 3)

def calculate_content_similarity(scrape_content, idea_introduction):
    """Calculate similarity between scrape content and idea introduction"""
    if not scrape_content or not idea_introduction:
        return 0.0
    
    # Normalize both texts
    norm_content = normalize_title(scrape_content)
    norm_intro = normalize_title(idea_introduction)
    
    if not norm_content or not norm_intro:
        return 0.0
    
    # Method 1: Sequence matcher (overall similarity)
    seq_similarity = SequenceMatcher(None, norm_content, norm_intro).ratio()
    
    # Method 2: Word overlap (how many words are common)
    words_content = set(norm_content.split())
    words_intro = set(norm_intro.split())
    
    if not words_content or not words_intro:
        word_similarity = 0.0
    else:
        intersection = words_content.intersection(words_intro)
        union = words_content.union(words_intro)
        word_similarity = len(intersection) / len(union) if union else 0.0
    
    # Method 3: Check for key concept matches (common startup/business terms)
    key_terms = ['app', 'tool', 'saas', 'startup', 'business', 'ai', 'platform', 'service', 'software', 'website', 'mobile', 'web', 'api', 'integration', 'automation', 'productivity', 'marketing', 'sales', 'analytics', 'data', 'user', 'customer', 'revenue', 'growth', 'validation', 'mvp', 'beta', 'launch', 'market', 'industry', 'solution', 'problem', 'feature', 'functionality']
    
    content_lower = scrape_content.lower()
    intro_lower = idea_introduction.lower()
    
    content_key_terms = sum(1 for term in key_terms if term in content_lower)
    intro_key_terms = sum(1 for term in key_terms if term in intro_lower)
    
    if content_key_terms > 0 and intro_key_terms > 0:
        common_key_terms = sum(1 for term in key_terms if term in content_lower and term in intro_lower)
        key_term_similarity = common_key_terms / max(content_key_terms, intro_key_terms)
    else:
        key_term_similarity = 0.0
    
    # Combine all methods with weights
    final_similarity = (seq_similarity * 0.3 + word_similarity * 0.4 + key_term_similarity * 0.3)
    
    return round(final_similarity, 3)

def find_best_title_match(scrape_title, idea_details, used_indices, threshold=0.3):
    """Find the best matching idea detail based on title similarity"""
    best_match = None
    best_score = 0.0
    
    for i, idea_detail in enumerate(idea_details):
        # Skip if this idea detail has already been used
        if i in used_indices:
            continue
            
        # Try to extract a title from the introduction
        introduction = idea_detail.get('introduction', '')
        if not introduction:
            continue
        
        # Extract the first sentence or first few words as a potential title
        # Look for patterns like "AppName is..." or "ToolName is..."
        title_match = re.search(r'^([A-Z][a-zA-Z0-9\s]+?)(?:\s+is\s+|\s+is\s+a\s+|\s+is\s+an\s+|\s+is\s+a\s+tool|\s+is\s+an\s+app)', introduction)
        
        if title_match:
            extracted_title = title_match.group(1).strip()
        else:
            # Fallback: take first 5-10 words as title
            words = introduction.split()[:8]
            extracted_title = ' '.join(words)
        
        # Calculate similarity
        similarity = calculate_title_similarity(scrape_title, extracted_title)
        
        if similarity > best_score and similarity >= threshold:
            best_score = similarity
            best_match = idea_detail
    
    return best_match, best_score

def merge_responses():
    """Merge scrape agent and idea detailing agent responses using sequential matching with fuzzy fallback"""
    
    print("🔗 Response Merging Script")
    print("==========================")
    
    # Check if both response files exist
    if not os.path.exists("scrape_agents_ideas.json"):
        print("❌ Error: scrape_agents_ideas.json not found!")
        print("Please run the extraction script first:")
        print("   python3 extract_responses.py")
        return False
    
    if not os.path.exists("idea_detailing_agent_response.json"):
        print("❌ Error: idea_detailing_agent_response.json not found!")
        print("Please run the extraction script first:")
        print("   python3 extract_responses.py")
        return False
    
    print("✅ Found both response files")
    print("📁 scrape_agents_ideas.json")
    print("📁 idea_detailing_agent_response.json")
    
    print("")
    print("============================================================")
    print("MERGING RESPONSES USING SEQUENTIAL MATCHING")
    print("============================================================")
    
    print("🔍 Running merge logic...")
    
    try:
        # Load scrape agent response
        with open('scrape_agents_ideas.json', 'r', encoding='utf-8') as f:
            scrape_data = json.load(f)
        
        # Load idea detailing agent response
        with open('idea_detailing_agent_response.json', 'r', encoding='utf-8') as f:
            idea_detailing_data = json.load(f)
        
        # Handle different data structures
        scrape_ideas = scrape_data.get('ideas', scrape_data) if isinstance(scrape_data, dict) else scrape_data
        idea_details = idea_detailing_data.get('ideas', idea_detailing_data) if isinstance(idea_detailing_data, dict) else idea_detailing_data
        
        print(f"📊 Found {len(scrape_ideas)} scrape ideas")
        print(f"📊 Found {len(idea_details)} idea detailing analyses")
        
        # Check if counts match - if they do, use sequential matching
        if len(scrape_ideas) == len(idea_details):
            print("✅ Counts match - using sequential matching")
            use_sequential = True
        else:
            print(f"⚠️  Counts don't match - using fuzzy matching for differences")
            use_sequential = False
        
        # Create merged ideas
        merged_ideas = []
        matched_count = 0
        unmatched_count = 0
        
        if use_sequential:
            # Sequential matching - match by index position
            for i in range(len(scrape_ideas)):
                scrape_idea = scrape_ideas[i]
                idea_detail = idea_details[i]
                
                scrape_title = scrape_idea.get('title', '')
                if not scrape_title:
                    print(f"   ⚠️  Scrape idea {i+1} missing title")
                    unmatched_count += 1
                    continue
                
                # Verify the match by checking content similarity
                introduction = idea_detail.get('introduction', '')
                scrape_content = scrape_idea.get('content', '')
                
                if introduction and scrape_content:
                    # Calculate similarity between scrape content and idea introduction
                    content_similarity = calculate_content_similarity(scrape_content, introduction)
                    print(f"   ✅ Sequential match {i+1} (content similarity: {content_similarity}): {scrape_title[:50]}...")
                else:
                    print(f"   ✅ Sequential match {i+1}: {scrape_title[:50]}...")
                
                matched_count += 1
                
                # Extract evaluation scores
                evaluation_scores = idea_detail.get('evaluation_scores', {})
                innovation = evaluation_scores.get('innovation', 0)
                quality = evaluation_scores.get('quality', 0)
                problem_significance = evaluation_scores.get('problem_significance', 0)
                engagement_score = evaluation_scores.get('engagement_score', 0)
                
                # Calculate average evaluation score
                if all([innovation, quality, problem_significance]):
                    evaluation_score = round((innovation + quality + problem_significance) / 3, 1)
                else:
                    evaluation_score = 0
                
                # Create merged idea object matching the database schema
                merged_idea = {
                    "idea_id": None,  # Will be set by database
                    "title": scrape_idea.get('title', ''),
                    "url": scrape_idea.get('url', ''),
                    "content": scrape_idea.get('content', ''),
                    "evaluation_score": evaluation_score,
                    "introduction": idea_detail.get('introduction', ''),
                    "implementation_plan": idea_detail.get('implementation_plan', ''),
                    "market_analysis": idea_detail.get('market_analysis', ''),
                    "user_comments": idea_detail.get('user_comments', ''),
                    "innovation": innovation,
                    "quality": quality,
                    "problem_significance": problem_significance,
                    "engagement_score": engagement_score,
                    "reasoning_behind_score": idea_detail.get('reasoning_behind_scores', ''),
                    "advise_for_improvement": idea_detail.get('advice_for_improvement', ''),
                    "date_of_post": scrape_idea.get('date', ''),
                    "source_subreddit": extract_source_subreddit(scrape_idea.get('url', '')),
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                
                merged_ideas.append(merged_idea)
        
        else:
            # Fuzzy matching for when counts don't match
            print("🔍 Applying fuzzy matching logic...")
            used_idea_detail_indices = set()
            
            for scrape_idea in scrape_ideas:
                scrape_title = scrape_idea.get('title', '')
                if not scrape_title:
                    print(f"   ⚠️  Scrape idea missing title")
                    unmatched_count += 1
                    continue
                
                # Find best matching idea detail
                best_match, similarity_score = find_best_title_match(scrape_title, idea_details, used_idea_detail_indices)
                
                if best_match:
                    # Find the index of the best match
                    best_match_index = idea_details.index(best_match)
                    used_idea_detail_indices.add(best_match_index)
                    matched_count += 1
                    
                    # Extract evaluation scores
                    evaluation_scores = best_match.get('evaluation_scores', {})
                    innovation = evaluation_scores.get('innovation', 0)
                    quality = evaluation_scores.get('quality', 0)
                    problem_significance = evaluation_scores.get('problem_significance', 0)
                    engagement_score = evaluation_scores.get('engagement_score', 0)
                    
                    # Calculate average evaluation score
                    if all([innovation, quality, problem_significance]):
                        evaluation_score = round((innovation + quality + problem_significance) / 3, 1)
                    else:
                        evaluation_score = 0
                    
                    # Create merged idea object matching the database schema
                    merged_idea = {
                        "idea_id": None,  # Will be set by database
                        "title": scrape_idea.get('title', ''),
                        "url": scrape_idea.get('url', ''),
                        "content": scrape_idea.get('content', ''),
                        "evaluation_score": evaluation_score,
                        "introduction": best_match.get('introduction', ''),
                        "implementation_plan": best_match.get('implementation_plan', ''),
                        "market_analysis": best_match.get('market_analysis', ''),
                        "user_comments": best_match.get('user_comments', ''),
                        "innovation": innovation,
                        "quality": quality,
                        "problem_significance": problem_significance,
                        "engagement_score": engagement_score,
                        "reasoning_behind_score": best_match.get('reasoning_behind_scores', ''),
                        "advise_for_improvement": best_match.get('advice_for_improvement', ''),
                        "date_of_post": scrape_idea.get('date', ''),
                        "source_subreddit": extract_source_subreddit(scrape_idea.get('url', '')),
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }
                    
                    merged_ideas.append(merged_idea)
                    print(f"   ✅ Fuzzy matched (similarity: {similarity_score}): {scrape_title[:50]}...")
                else:
                    print(f"   ❌ No good match found for: {scrape_title[:50]}...")
                    unmatched_count += 1
        
        print(f"\n📊 Matching Summary:")
        print(f"   ✅ Matched and merged: {matched_count}")
        print(f"   ❌ Unmatched: {unmatched_count}")
        print(f"   📁 Total ideas in merged file: {len(merged_ideas)}")
        
        # Save merged results only if we have matches
        if merged_ideas:
            merged_data = {
                "ideas": merged_ideas,
                "total_count": len(merged_ideas),
                "matched_count": matched_count,
                "unmatched_count": unmatched_count,
                "merged_at": datetime.now().isoformat()
            }
            
            with open('merged_ideas.json', 'w', encoding='utf-8') as f:
                json.dump(merged_data, f, indent=2, ensure_ascii=False)
            
            print(f"\n🎉 Successfully merged {len(merged_ideas)} ideas!")
            print("📁 Saved to merged_ideas.json")
            return True
        else:
            print("\n❌ No ideas were matched and merged!")
            return False
        
    except Exception as e:
        print(f"❌ Error during merge: {e}")
        return False

def main():
    """Main function"""
    try:
        success = merge_responses()
        
        if success:
            print("")
            print("============================================================")
            print("MERGE COMPLETED")
            print("============================================================")
            
            print("📁 Files created:")
            if os.path.exists("merged_ideas.json"):
                size = os.path.getsize("merged_ideas.json")
                print(f"   ✅ merged_ideas.json ({size} bytes)")
                
                # Show summary
                with open('merged_ideas.json', 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    idea_count = data.get('total_count', 0)
                    matched_count = data.get('matched_count', 0)
                    unmatched_count = data.get('unmatched_count', 0)
                    print(f"   📊 Total ideas merged: {idea_count}")
                    print(f"   ✅ Matched: {matched_count}")
                    print(f"   ❌ Unmatched: {unmatched_count}")
            else:
                print("   ❌ merged_ideas.json (failed to create)")
            
            print("")
            print("🎉 Merge process completed!")
        else:
            print("❌ Merge failed!")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()