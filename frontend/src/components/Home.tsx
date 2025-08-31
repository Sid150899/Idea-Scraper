import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase, ScrapedIdea } from '../lib/supabase'
import './Home.css'

const Home: React.FC = () => {
  const [ideas, setIdeas] = useState<ScrapedIdea[]>([])
  const [savedIdeas, setSavedIdeas] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<string>('')
  const [showSaved, setShowSaved] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [ideasPerPage] = useState(10)
  
  const { user, logout } = useAuth()

  useEffect(() => {
    fetchIdeas()
    fetchSavedIdeas()
    setLastRefreshed(new Date().toLocaleString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset to first page when search term or saved filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, showSaved])

  const fetchIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from('scraped_idea')
        .select('*')
        .order('date_of_post', { ascending: false })

      if (error) {
        console.error('Error fetching ideas:', error)
      } else {
        setIdeas(data || [])
      }
    } catch (error) {
      console.error('Error fetching ideas:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedIdeas = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('saved_ideas')
        .select('idea_id')
        .eq('user_id', user.user_id)

      if (error) {
        console.error('Error fetching saved ideas:', error)
      } else {
        const savedIds = new Set(data?.map(item => item.idea_id) || [])
        setSavedIdeas(savedIds)
      }
    } catch (error) {
      console.error('Error fetching saved ideas:', error)
    }
  }

  const toggleSaveIdea = async (ideaId: number) => {
    if (!user) return

    console.log('Toggling save for idea:', ideaId, 'User:', user.user_id, 'Current saved state:', savedIdeas.has(ideaId))
    console.log('User object:', user)

    try {
      if (savedIdeas.has(ideaId)) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_ideas')
          .delete()
          .eq('user_id', user.user_id)
          .eq('idea_id', ideaId)

        if (error) {
          console.error('Error removing saved idea:', error)
        } else {
          setSavedIdeas(prev => {
            const newSet = new Set(prev)
            newSet.delete(ideaId)
            return newSet
          })
        }
      } else {
        // Add to saved
        console.log('Adding idea to saved...')
        console.log('Inserting data:', { user_id: user.user_id, idea_id: ideaId })
        
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
          .insert([{ user_id: user.user_id, idea_id: ideaId }])

        if (error) {
          console.error('Error saving idea:', error)
          alert(`Failed to save idea: ${error.message}`)
        } else {
          setSavedIdeas(prev => new Set(prev).add(ideaId))
        }
      }
    } catch (error) {
      console.error('Error toggling saved idea:', error)
      alert(`Unexpected error: ${error}`)
    }
  }

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         idea.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSaved = showSaved ? savedIdeas.has(idea.idea_id) : true
    return matchesSearch && matchesSaved
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredIdeas.length / ideasPerPage)
  const indexOfLastIdea = currentPage * ideasPerPage
  const indexOfFirstIdea = indexOfLastIdea - ideasPerPage
  const currentIdeas = filteredIdeas.slice(indexOfFirstIdea, indexOfLastIdea)

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pageNumbers = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    return (
      <div className="pagination">
        <button
          className="pagination-button"
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
        >
          ← Previous
        </button>
        
        <div className="page-numbers">
          {startPage > 1 && (
            <>
              <button
                className="pagination-button"
                onClick={() => goToPage(1)}
              >
                1
              </button>
              {startPage > 2 && <span className="pagination-ellipsis">...</span>}
            </>
          )}
          
          {pageNumbers.map(number => (
            <button
              key={number}
              className={`pagination-button ${currentPage === number ? 'active' : ''}`}
              onClick={() => goToPage(number)}
            >
              {number}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
              <button
                className="pagination-button"
                onClick={() => goToPage(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
        
        <button
          className="pagination-button"
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
        >
          Next →
        </button>
      </div>
    )
  }

  const renderStars = (score: number) => {
    const stars = []
    for (let i = 1; i <= 10; i++) {
      let starClass = ''
      
      if (i <= Math.floor(score)) {
        // Full star for complete integer parts
        starClass = 'filled'
      } else if (i === Math.ceil(score) && score % 1 > 0) {
        // Partial star for decimal part
        const partialFill = score % 1
        starClass = `partial-${Math.round(partialFill * 100)}`
      }
      
      stars.push(
        <span key={i} className={`star ${starClass}`}>
          ★
        </span>
      )
    }
    return (
      <div className="rating-container">
        <div className="stars">{stars}</div>
        <span className="score-text">({score.toFixed(1)}/10)</span>
      </div>
    )
  }

  if (loading) {
    return <div className="loading">Loading ideas...</div>
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="home-title">PALETTE of IDEAS</h1>
        
        <div className="nav-bar">
          <button
            className={`nav-button ${!showSaved ? 'active' : ''}`}
            onClick={() => setShowSaved(false)}
          >
            Search
          </button>
          <button
            className={`nav-button ${showSaved ? 'active' : ''}`}
            onClick={() => setShowSaved(true)}
          >
            Saved
          </button>
        </div>

        <div className="header-info">
          <div className="refresh-info">
            <span>Last Refreshed:</span>
            <span>{lastRefreshed}</span>
          </div>
          
          <div className="header-actions">
            <button className="menu-button" onClick={logout}>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search ideas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <main className="ideas-container">
        {filteredIdeas.length === 0 ? (
          <div className="no-ideas">
            {showSaved ? 'No saved ideas found.' : 'No ideas found.'}
          </div>
        ) : (
          <>
            <div className="results-info">
              Showing {indexOfFirstIdea + 1}-{Math.min(indexOfLastIdea, filteredIdeas.length)} of {filteredIdeas.length} ideas
            </div>
            
            {currentIdeas.map((idea) => (
              <div key={idea.idea_id} className="idea-card">
                <div className="card-header">
                  <div className="title-date-container">
                    <h3 className="idea-title">{idea.title}</h3>
                    <span className="idea-date">| {new Date(idea.date_of_post).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}</span>
                  </div>
                  <button
                    className={`save-button ${savedIdeas.has(idea.idea_id) ? 'saved' : ''}`}
                    onClick={() => toggleSaveIdea(idea.idea_id)}
                    title={savedIdeas.has(idea.idea_id) ? 'Remove from saved' : 'Save idea'}
                  >
                    🏁
                  </button>
                </div>
                
                <p className="idea-description">{idea.content}</p>
                
                <div className="idea-metadata">
                  <div className="stars-container">
                    {renderStars(idea.evaluation_score)}
                  </div>
                  <span className="source-subreddit">{idea.source_subreddit}</span>
                  <span className="engagement">Engagement: {idea.engagement_score}</span>
                </div>
                
                <Link to={`/idea/${idea.idea_id}`} className="view-details">
                  View Details →
                </Link>
              </div>
            ))}
            
            {renderPagination()}
          </>
        )}
      </main>
    </div>
  )
}

export default Home
