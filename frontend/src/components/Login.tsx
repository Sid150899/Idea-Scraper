import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Login.css'

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const startTime = performance.now()
    console.log('🚀 Login form submission started at:', new Date().toISOString())

    try {
      let result
      if (isLogin) {
        console.log('🔐 Attempting login...')
        result = await login(email, password)
      } else {
        console.log('📝 Attempting registration...')
        result = await register(firstName, lastName, email, password)
      }

      const endTime = performance.now()
      console.log(`⏱️ Form submission completed in ${(endTime - startTime).toFixed(2)}ms`)

      if (result.error) {
        console.error('❌ Error result:', result.error)
        setError(result.error)
      } else {
        console.log('✅ Success, navigating to home...')
        navigate('/')
      }
    } catch (err) {
      const endTime = performance.now()
      console.error(`❌ Unexpected error after ${(endTime - startTime).toFixed(2)}ms:`, err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <h1 className="login-title">
        <span className="logo-palette">PALETTE</span>
        <span className="logo-of">of</span>
        <span className="logo-ideas">IDEAS</span>
      </h1>
      
      <div className="form-container">
        <div className="toggle-container">
          <button
            type="button"
            className={`toggle-button ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
          <button
            type="button"
            className={`toggle-button ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required={!isLogin}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required={!isLogin}
                  className="form-input"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
          
          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
              <div className="loading-details">
                <small>This may take a few seconds</small>
                <small>Please don't close this page</small>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default Login
