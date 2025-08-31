import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

// Extend Window interface to include our custom properties
declare global {
  interface Window {
    authContext?: any
    runAuthFlowTest?: () => Promise<void>
    checkAuthContextReady?: () => boolean
    testResults?: any
    debugAuthState?: (email: string) => Promise<any>
    checkSupabaseConfig?: () => Promise<any>
  }
}

const AuthDebug: React.FC = () => {
  const { register, login, user, loading, clearStaleCache, debugAuthState, checkSupabaseConfig } = useAuth()
  
  // Expose auth context to window for testing
  React.useEffect(() => {
    window.authContext = { register, login, user, loading, clearStaleCache, debugAuthState, checkSupabaseConfig }
    
    // Check if test script is already loaded
    if (window.runAuthFlowTest) {
      const statusElement = document.getElementById('test-script-status')
      if (statusElement) {
        statusElement.textContent = '✅ Already Loaded'
        statusElement.style.color = 'green'
      }
    }
    
    return () => {
      delete window.authContext
    }
  }, [register, login, user, loading, clearStaleCache, debugAuthState, checkSupabaseConfig])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')

  const handleRegister = async () => {
    setMessage('')
    console.log('=== REGISTRATION START ===')
    
    try {
      const result = await register(firstName, lastName, email, password)
      
      if (result.error) {
        setMessage(result.error)
        setMessageType('error')
        console.error('Registration failed:', result.error)
      } else {
        setMessage(result.success || 'Registration successful!')
        setMessageType('success')
        console.log('Registration successful:', result)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setMessage(`Registration error: ${errorMsg}`)
      setMessageType('error')
      console.error('Registration exception:', error)
    }
    
    console.log('=== REGISTRATION END ===')
  }

  const handleLogin = async () => {
    setMessage('')
    console.log('=== LOGIN START ===')
    
    try {
      const result = await login(email, password)
      
      if (result.error) {
        setMessage(result.error)
        setMessageType('error')
        console.error('Login failed:', result.error)
      } else {
        setMessage('Login successful!')
        setMessageType('success')
        console.log('Login successful:', result)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setMessage(`Login error: ${errorMsg}`)
      setMessageType('error')
      console.error('Login exception:', error)
    }
    
    console.log('=== LOGIN END ===')
  }

  const clearForm = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPassword('')
    setMessage('')
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🔐 Authentication Debug Tool</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Current Status</h3>
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user ? `${user.first_name} ${user.last_name} (${user.email})` : 'None'}</p>
        <p><strong>User ID:</strong> {user?.user_id || 'N/A'}</p>
        <p><strong>Auth Context Ready:</strong> <span style={{ color: 'green', fontWeight: 'bold' }}>✅ Yes</span></p>
        <p><strong>Test Script Status:</strong> <span id="test-script-status" style={{ color: 'orange', fontWeight: 'bold' }}>⏳ Not Loaded</span></p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Test User Credentials</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={handleRegister}
          disabled={!firstName || !lastName || !email || !password}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Register
        </button>
        <button
          onClick={handleLogin}
          disabled={!email || !password}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
        <button
          onClick={clearForm}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
        <button
          onClick={() => {
            const script = document.createElement('script')
            script.src = '/test-auth-flow.js'
            script.onload = () => {
              console.log('Test script loaded!')
              const statusElement = document.getElementById('test-script-status')
              if (statusElement) {
                statusElement.textContent = '✅ Loaded'
                statusElement.style.color = 'green'
              }
            }
            script.onerror = () => {
              console.error('Failed to load test script')
              const statusElement = document.getElementById('test-script-status')
              if (statusElement) {
                statusElement.textContent = '❌ Failed'
                statusElement.style.color = 'red'
              }
            }
            document.head.appendChild(script)
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Load Test Script
        </button>
        <button
          onClick={() => {
            const script = document.createElement('script')
            script.src = '/debug-auth.js'
            script.onload = () => {
              console.log('Debug script loaded!')
              alert('Debug script loaded! Run debugRegistration() in console to debug the auth issue.')
            }
            script.onerror = () => {
              console.error('Failed to load debug script')
              alert('Failed to load debug script')
            }
            document.head.appendChild(script)
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Load Debug Script
        </button>
        <button
          onClick={() => {
            if (window.authContext) {
              console.log('✅ Auth context is available:', window.authContext)
              alert('Auth context is working! Check console for details.')
            } else {
              console.error('❌ Auth context not available')
              alert('Auth context not available. Make sure the component has loaded.')
            }
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Auth Context
        </button>
        <button
          onClick={async () => {
            if (email) {
              console.log('🔍 Debugging auth state for:', email)
              const result = await debugAuthState(email)
              console.log('Debug result:', result)
              setMessage(`Debug complete. Check console for details.`)
              setMessageType('info')
            } else {
              setMessage('Please enter an email address first')
              setMessageType('error')
            }
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Debug Auth State
        </button>
        <button
          onClick={async () => {
            console.log('🔧 Checking Supabase configuration...')
            const result = await checkSupabaseConfig()
            console.log('Config check result:', result)
            if ('success' in result) {
              setMessage('Supabase configuration is working correctly')
              setMessageType('success')
            } else if ('error' in result) {
              setMessage(`Config issue: ${result.error}`)
              setMessageType('error')
            }
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Check Supabase Config
        </button>
      </div>

      {message && (
        <div style={{
          padding: '15px',
          borderRadius: '4px',
          backgroundColor: messageType === 'error' ? '#f8d7da' : messageType === 'success' ? '#d4edda' : '#d1ecf1',
          color: messageType === 'error' ? '#721c24' : messageType === 'success' ? '#155724' : '#0c5460',
          border: `1px solid ${messageType === 'error' ? '#f5c6cb' : messageType === 'success' ? '#c3e6cb' : '#bee5eb'}`
        }}>
          <strong>{messageType === 'error' ? '❌ Error:' : messageType === 'success' ? '✅ Success:' : 'ℹ️ Info:'}</strong> {message}
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
        <h4>🔍 Debug Instructions</h4>
        <ol>
          <li>Fill in the form with test credentials</li>
          <li>Click "Register" and check the console for detailed logs</li>
          <li>Click "Login" with the same credentials</li>
          <li>Check the console for any error messages or mismatches</li>
          <li>Look for user ID mismatches between Supabase Auth and custom table</li>
        </ol>
        <p><strong>Note:</strong> Open browser console (F12) to see detailed authentication flow logs.</p>
        
        <h4 style={{ marginTop: '15px' }}>🧪 Automated Testing</h4>
        <ol>
          <li>Click "Test Auth Context" to verify the auth context is available</li>
          <li>Click "Load Test Script" to load the automated test suite</li>
          <li>Open browser console (F12)</li>
          <li>Run <code>checkAuthContextReady()</code> to verify auth context is available</li>
          <li>Run <code>runAuthFlowTest()</code> to execute the full test suite</li>
        </ol>
        <p><strong>Tip:</strong> The test script will automatically generate unique test credentials.</p>
        
        <h4 style={{ marginTop: '15px' }}>🔍 Debug Authentication Issues</h4>
        <ol>
          <li>Click "Load Debug Script" to load the debug tools</li>
          <li>Open browser console (F12)</li>
          <li>Run <code>debugRegistration()</code> to test the complete flow step by step</li>
          <li>Check console logs for detailed error analysis</li>
          <li>Use <code>checkExistingUser(email)</code> to check specific user state</li>
          <li>Use <code>testEmailFormats()</code> to find working email formats</li>
          <li>Click "Check Supabase Config" to verify Supabase setup</li>
        </ol>
        <p><strong>Note:</strong> The debug script will help identify exactly where the authentication is failing.</p>
      </div>
    </div>
  )
}

export default AuthDebug
