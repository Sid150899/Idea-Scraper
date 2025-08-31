import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase, ScrapedIdea } from '../lib/supabase'
import './IdeaDetail.css'

const IdeaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [idea, setIdea] = useState<ScrapedIdea | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  
  const { user } = useAuth()

  useEffect(() => {
    if (id) {
      console.log('Component mounted with idea ID:', id)
      fetchIdea(parseInt(id))
      checkIfSaved(parseInt(id))
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    console.log('User state changed:', user)
    if (user && idea) {
      checkIfSaved(idea.idea_id)
    }
  }, [user, idea]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchIdea = async (ideaId: number) => {
    try {
      const { data, error } = await supabase
        .from('scraped_idea')
        .select('*')
        .eq('idea_id', ideaId)
        .single()

      if (error) {
        console.error('Error fetching idea:', error)
      } else {
        setIdea(data)
      }
    } catch (error) {
      console.error('Error fetching idea:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkIfSaved = async (ideaId: number) => {
    if (!user) {
      console.log('No user available for checkIfSaved')
      return
    }
    
    console.log('Checking if idea is saved:', ideaId, 'for user:', user.user_id)
    
    try {
      // First, let's test if the table exists and we can query it
      const { data: tableTest, error: tableError } = await supabase
        .from('saved_ideas')
        .select('*')
        .limit(1)
      
      if (tableError) {
        console.error('Table access error:', tableError)
        alert(`Database error: ${tableError.message}`)
        return
      }
      
      console.log('Table access successful, testing specific query...')
      
      const { data, error } = await supabase
        .from('saved_ideas')
        .select('idea_id')
        .eq('user_id', user.user_id)
        .eq('idea_id', ideaId)
        .single()

      if (error) {
        console.log('Error checking saved status:', error.message)
        if (error.code === 'PGRST116') {
          // No rows returned - idea is not saved
          setIsSaved(false)
        }
      } else if (data) {
        console.log('Idea is saved:', data)
        setIsSaved(true)
      }
    } catch (error) {
      console.log('Exception in checkIfSaved:', error)
      // Idea is not saved
      setIsSaved(false)
    }
  }

  const toggleSave = async () => {
    if (!user || !idea) {
      console.log('User or idea not available:', { user: !!user, idea: !!idea })
      return
    }

    console.log('Toggling save for idea:', idea.idea_id, 'User:', user.user_id, 'Current saved state:', isSaved)
    console.log('User object:', user)

    try {
      if (isSaved) {
        // Remove from saved
        console.log('Removing idea from saved...')
        const { error } = await supabase
          .from('saved_ideas')
          .delete()
          .eq('user_id', user.user_id)
          .eq('idea_id', idea.idea_id)

        if (error) {
          console.error('Error removing saved idea:', error)
          alert(`Failed to remove from saved: ${error.message}`)
        } else {
          console.log('Successfully removed from saved')
          setIsSaved(false)
        }
      } else {
        // Add to saved
        console.log('Adding idea to saved...')
        console.log('Inserting data:', { user_id: user.user_id, idea_id: idea.idea_id })
        
        // First verify the user exists in the User table
        const { data: userCheck, error: userCheckError } = await supabase
          .from('User')
          .select('user_id')
          .eq('user_id', user.user_id)
          .single()
        
        if (userCheckError) {
          console.error('User not found in User table:', userCheckError)
          alert(`User validation failed: ${userCheckError.message}`)
          return
        }
        
        console.log('User validation passed:', userCheck)
        
        const { error } = await supabase
          .from('saved_ideas')
          .insert([{ user_id: user.user_id, idea_id: idea.idea_id }])

        if (error) {
          console.error('Error saving idea:', error)
          alert(`Failed to save idea: ${error.message}`)
        } else {
          console.log('Successfully saved idea')
          setIsSaved(true)
        }
      }
    } catch (error) {
      console.error('Error toggling saved idea:', error)
      alert(`Unexpected error: ${error}`)
    }
  }

  const renderStars = (score: number, useBeigeTheme: boolean = false) => {
    // Handle edge cases
    if (score < 0) score = 0
    if (score > 10) score = 10
    
    const stars = []
    for (let i = 1; i <= 10; i++) {
      let starColor = '#e0e0e0' // Default empty star color
      
      if (i <= Math.floor(score)) {
        // Full star for complete integer parts
        starColor = useBeigeTheme ? '#f5f5dc' : '#000'
      } else if (i === Math.ceil(score) && score % 1 > 0) {
        // Partial star for decimal part - round to nearest 10% increment
        const partialFill = score % 1
        const partialPercent = Math.round(partialFill * 10) * 10
        
        if (useBeigeTheme) {
          // Beige theme for article header (black background)
          if (partialPercent <= 10) starColor = '#f8f8f0'
          else if (partialPercent <= 20) starColor = '#f0f0e8'
          else if (partialPercent <= 30) starColor = '#e8e8e0'
          else if (partialPercent <= 40) starColor = '#e0e0d8'
          else if (partialPercent <= 50) starColor = '#d8d8d0'
          else if (partialPercent <= 60) starColor = '#d0d0c8'
          else if (partialPercent <= 70) starColor = '#c8c8c0'
          else if (partialPercent <= 80) starColor = '#c0c0b8'
          else if (partialPercent <= 90) starColor = '#b8b8b0'
          else starColor = '#f5f5dc'
        } else {
          // Black theme for regular content (light background)
          if (partialPercent <= 10) starColor = '#f0f0f0'
          else if (partialPercent <= 20) starColor = '#e8e8e8'
          else if (partialPercent <= 30) starColor = '#e0e0e0'
          else if (partialPercent <= 40) starColor = '#d8d8d8'
          else if (partialPercent <= 50) starColor = '#d0d0d0'
          else if (partialPercent <= 60) starColor = '#c8c8c8'
          else if (partialPercent <= 70) starColor = '#c0c0c0'
          else if (partialPercent <= 80) starColor = '#b8b8b8'
          else if (partialPercent <= 90) starColor = '#b0b0b0'
          else starColor = '#000'
        }
      }
      
      stars.push(
        <span 
          key={`star-${i}-${score}-${useBeigeTheme}`}
          style={{ 
            '--star-color': starColor,
            display: 'inline-block',
            fontSize: '1rem',
            marginRight: '2px'
          } as React.CSSProperties & { '--star-color': string }}
          className="star-dynamic"
        >
          ★
        </span>
      )
    }
    return (
      <div className="rating-container">
        <div className="stars">
          {stars}
        </div>
        <span className="score-text">({score.toFixed(1)}/10)</span>
      </div>
    )
  }

  if (loading) {
    return <div className="loading">Loading idea details...</div>
  }

  if (!idea) {
    return <div className="error">Idea not found</div>
  }

  return (
    <div className="detail-container">
      <header className="detail-header">
        <Link to="/" className="back-button">← Back to Ideas</Link>
        <h1 className="detail-title">{idea.title}</h1>
        <button
          className={`save-button ${isSaved ? 'saved' : ''}`}
          onClick={toggleSave}
          title={isSaved ? 'Remove from saved' : 'Save idea'}
        >
          {isSaved ? 'Saved' : 'Save'}
        </button>
      </header>

      <div className="detail-content">
        <article className="idea-article">
          <div className="article-header">
            <div className="article-meta">
              <span className="meta-item">
                <strong>Source:</strong> {idea.source_subreddit}
              </span>
              <span className="meta-item">
                <strong>Posted:</strong> {new Date(idea.date_of_post).toLocaleDateString()}
              </span>
              <span className="meta-item">
                <strong>Rating:</strong> {(() => {
                  console.log('Rendering stars with score:', idea.evaluation_score, 'useBeigeTheme: true');
                  return renderStars(idea.evaluation_score, true);
                })()}
              </span>
            </div>
          </div>

          <div className="article-body">
            <h2>Introduction</h2>
            <p>{idea.introduction}</p>

            <h2>Implementation Plan</h2>
            <p>{idea.implementation_plan}</p>

            <h2>Market Analysis</h2>
            <p>{idea.market_analysis}</p>

            <h2>User Comments & Feedback</h2>
            <p>{idea.user_comments}</p>

            <h2>Evaluation Scores</h2>
            <div className="evaluation-table">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Score</th>
                    <th>Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Innovation</td>
                    <td>{idea.innovation}/10</td>
                    <td>
                      How unique and novel is the idea? Higher scores for breakthrough ideas, 
                      lower for copycat concepts. Considers if it's a completely new concept, 
                      a significant improvement on existing solutions, or just a minor variation.
                    </td>
                  </tr>
                  <tr>
                    <td>Quality</td>
                    <td>{idea.quality}/10</td>
                    <td>
                      How practical and well-thought-out is the execution potential? 
                      Considers technical feasibility, business model clarity, market fit, 
                      and overall planning quality. Higher scores for well-researched, viable ideas.
                    </td>
                  </tr>
                  <tr>
                    <td>Problem Significance</td>
                    <td>{idea.problem_significance}/10</td>
                    <td>
                      How critical or impactful is the problem being solved? 
                      Considers the size of the affected population, how painful the problem is, 
                      and the potential impact of solving it. Higher scores for addressing 
                      widespread, urgent problems.
                    </td>
                  </tr>
                  <tr>
                    <td>Engagement</td>
                    <td>{idea.engagement_score}/100</td>
                    <td>
                      User engagement and interest level in the idea. 
                      Higher scores indicate more community interest and discussion.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>Reasoning Behind Scores</h2>
            <p>{idea.reasoning_behind_score}</p>

            <h2>Advice for Improvement</h2>
            <p>{idea.advise_for_improvement}</p>

            {idea.url && (
              <a 
                href={idea.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="original-link"
              >
                View Original Post →
              </a>
            )}
          </div>
        </article>
      </div>
    </div>
  )
}

export default IdeaDetail
