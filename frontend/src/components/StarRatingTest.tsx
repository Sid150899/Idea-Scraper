import React from 'react'

// Test component to demonstrate star rating logic
const StarRatingTest: React.FC = () => {
  const testScores = [8.0, 5.3, 7.3, 6.3, 9.7, 2.1, 0.0, 10.0, 4.8, 6.9]

  const renderStars = (score: number) => {
    // Handle edge cases
    if (score < 0) score = 0
    if (score > 10) score = 10
    
    const stars = []
    for (let i = 1; i <= 10; i++) {
      let starClass = ''
      
      if (i <= Math.floor(score)) {
        // Full star for complete integer parts
        starClass = 'filled'
      } else if (i === Math.ceil(score) && score % 1 > 0) {
        // Partial star for decimal part - round to nearest 10% increment
        const partialFill = score % 1
        const partialPercent = Math.round(partialFill * 10) * 10
        starClass = `partial-${partialPercent}`
        
        // Ensure partialPercent is within valid range (0-100)
        if (partialPercent < 0) starClass = 'partial-10'
        if (partialPercent > 100) starClass = 'partial-100'
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

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Star Rating Test - Partial Stars for Fractional Scores</h2>
      <p>This component tests the star rating system with various decimal scores to show how partial stars work.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Cases:</h3>
        <ul>
          <li><strong>8.0:</strong> Should show 8 full stars + 2 empty stars</li>
          <li><strong>5.3:</strong> Should show 5 full stars + 1 partial star at 30% + 4 empty stars</li>
          <li><strong>7.3:</strong> Should show 7 full stars + 1 partial star at 30% + 2 empty stars</li>
          <li><strong>6.3:</strong> Should show 6 full stars + 1 partial star at 30% + 3 empty stars</li>
          <li><strong>9.7:</strong> Should show 9 full stars + 1 partial star at 70% + 0 empty stars</li>
          <li><strong>2.1:</strong> Should show 2 full stars + 1 partial star at 10% + 7 empty stars</li>
          <li><strong>0.0:</strong> Should show 10 empty stars</li>
          <li><strong>10.0:</strong> Should show 10 full stars</li>
          <li><strong>4.8:</strong> Should show 4 full stars + 1 partial star at 80% + 5 empty stars</li>
          <li><strong>6.9:</strong> Should show 6 full stars + 1 partial star at 90% + 3 empty stars</li>
        </ul>
      </div>

      <div style={{ display: 'grid', gap: '15px' }}>
        {testScores.map((score, index) => (
          <div key={index} style={{ 
            border: '1px solid #ccc', 
            padding: '15px', 
            borderRadius: '8px',
            backgroundColor: '#f9f9f9'
          }}>
            <h4>Score: {score}</h4>
            {renderStars(score)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default StarRatingTest
