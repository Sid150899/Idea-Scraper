import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import { supabase } from '../../lib/supabase'

// Mock Supabase with proper structure
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      signIn: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ 
        data: { 
          subscription: { 
            unsubscribe: jest.fn() 
          } 
        } 
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          limit: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }
}))

// Test component for auth flow testing
const AuthFlowTestComponent = () => {
  const { user, login, register, logout, loading } = useAuth()
  const [lastError, setLastError] = React.useState<string | null>(null)
  const [lastSuccess, setLastSuccess] = React.useState<string | null>(null)
  
  const handleLogin = async () => {
    const result = await login('test@example.com', 'password')
    if (result.error) setLastError(result.error)
  }
  
  const handleRegister = async () => {
    const result = await register('John', 'Doe', 'test@example.com', 'password')
    if (result.error) setLastError(result.error)
    if (result.success) setLastSuccess(result.success)
  }
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading...' : 'Not Loading'}</div>
      <div data-testid="user">{user ? `User: ${user.email}` : 'No User'}</div>
      <div data-testid="error">{lastError || 'No Error'}</div>
      <div data-testid="success">{lastSuccess || 'No Success'}</div>
      <button onClick={handleLogin} data-testid="login-btn">Login</button>
      <button onClick={handleRegister} data-testid="register-btn">Register</button>
      <button onClick={logout} data-testid="logout-btn">Logout</button>
    </div>
  )
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('Authentication Flow Consistency Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('Registration Flow Consistency', () => {
    test('should not attempt automatic sign-in after registration', async () => {
      const mockSignUp = supabase.auth.signUp as jest.Mock
      const mockSignIn = supabase.auth.signInWithPassword as jest.Mock
      const mockInsert = supabase.from as jest.Mock
      
      // Mock successful signup
      mockSignUp.mockResolvedValue({
        data: { user: { email: 'test@example.com' } },
        error: null
      })
      
      // Mock successful user creation in custom table
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 123, email: 'test@example.com' },
            error: null
          })
        })
      })

      render(
        <TestWrapper>
          <AuthFlowTestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      const registerBtn = screen.getByTestId('register-btn')
      fireEvent.click(registerBtn)

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalled()
      })

      // Verify that automatic sign-in was NOT attempted
      expect(mockSignIn).not.toHaveBeenCalled()
      
      // Check for success message
      await waitFor(() => {
        expect(screen.getByTestId('success')).toHaveTextContent('User registered, please login')
      })
    })

    test('should handle existing user check correctly', async () => {
      const mockGetUser = supabase.from as jest.Mock
      const mockSignUp = supabase.auth.signUp as jest.Mock
      
      // Mock existing user check - user already exists
      mockGetUser.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: 123, email: 'test@example.com' },
              error: null
            })
          })
        })
      })

      render(
        <TestWrapper>
          <AuthFlowTestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      const registerBtn = screen.getByTestId('register-btn')
      fireEvent.click(registerBtn)

      // Should not call signUp since user already exists
      expect(mockSignUp).not.toHaveBeenCalled()
      
      // Should show appropriate error message
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('User already exists, please login')
      })
    })

    test('should handle registration with different email addresses', async () => {
      const mockSignUp = supabase.auth.signUp as jest.Mock
      const mockGetUser = supabase.from as jest.Mock
      const mockInsert = supabase.from as jest.Mock
      
      // Mock no existing user for first email
      mockGetUser.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows returned' }
            })
          })
        })
      })
      
      // Mock successful signup
      mockSignUp.mockResolvedValue({
        data: { user: { email: 'new@example.com' } },
        error: null
      })
      
      // Mock successful user creation
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 124, email: 'new@example.com' },
            error: null
          })
        })
      })

      render(
        <TestWrapper>
          <AuthFlowTestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      const registerBtn = screen.getByTestId('register-btn')
      fireEvent.click(registerBtn)

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
          options: {
            data: {
              first_name: 'John',
              last_name: 'Doe'
            }
          }
        })
      })
    })
  })

  describe('Login Flow Consistency', () => {
    test('should update last_login timestamp on successful login', async () => {
      const mockSignIn = supabase.auth.signInWithPassword as jest.Mock
      const mockGetSession = supabase.auth.getSession as jest.Mock
      const mockGetUser = supabase.from as jest.Mock
      const mockUpdate = supabase.from as jest.Mock
      
      // Mock successful signin
      mockSignIn.mockResolvedValue({
        data: { user: { email: 'test@example.com' } },
        error: null
      })
      
      // Mock session
      mockGetSession.mockResolvedValue({
        data: { session: { user: { email: 'test@example.com' } } }
      })
      
      // Mock user from custom table
      mockGetUser.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: 123, email: 'test@example.com' },
              error: null
            })
          })
        })
      })
      
      // Mock last_login update
      mockUpdate.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      })

      render(
        <TestWrapper>
          <AuthFlowTestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      const loginBtn = screen.getByTestId('login-btn')
      fireEvent.click(loginBtn)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled()
      })

      // Should attempt to update last_login
      expect(mockUpdate).toHaveBeenCalled()
    })

    test('should handle login with non-existent user gracefully', async () => {
      const mockSignIn = supabase.auth.signInWithPassword as jest.Mock
      
      // Mock authentication error
      mockSignIn.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' }
      })

      render(
        <TestWrapper>
          <AuthFlowTestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      const loginBtn = screen.getByTestId('login-btn')
      fireEvent.click(loginBtn)

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid login credentials')
      })
    })
  })

  describe('Session Management Consistency', () => {
    test('should handle session restoration consistently', async () => {
      const mockGetSession = supabase.auth.getSession as jest.Mock
      const mockGetUser = supabase.from as jest.Mock
      const mockUpdate = supabase.from as jest.Mock
      
      // Mock existing session
      mockGetSession.mockResolvedValue({
        data: { session: { user: { email: 'test@example.com' } } }
      })
      
      // Mock user from custom table
      mockGetUser.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: 123, email: 'test@example.com' },
              error: null
            })
          })
        })
      })
      
      // Mock last_login update
      mockUpdate.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      })

      render(
        <TestWrapper>
          <AuthFlowTestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      // Should restore session and update last_login
      expect(mockGetSession).toHaveBeenCalled()
      expect(mockGetUser).toHaveBeenCalled()
      expect(mockUpdate).toHaveBeenCalled()
    })

    test('should handle missing session gracefully', async () => {
      const mockGetSession = supabase.auth.getSession as jest.Mock
      
      // Mock no session
      mockGetSession.mockResolvedValue({
        data: { session: null }
      })

      render(
        <TestWrapper>
          <AuthFlowTestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      // Should not crash and should show no user
      expect(screen.getByTestId('user')).toHaveTextContent('No User')
    })
  })

  describe('Error Handling Consistency', () => {
    test('should handle database timeouts consistently', async () => {
      const mockGetUser = supabase.from as jest.Mock
      
      // Mock database timeout
      mockGetUser.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => 
              new Promise((resolve) => 
                setTimeout(() => resolve({ data: null, error: { message: 'Database timeout' } }), 4000)
              )
            )
          })
        })
      })

      render(
        <TestWrapper>
          <AuthFlowTestComponent />
        </TestWrapper>
      )

      // Should handle timeout gracefully
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      }, { timeout: 5000 })

      expect(screen.getByTestId('user')).toHaveTextContent('No User')
    })

    test('should handle table name case sensitivity consistently', async () => {
      const mockGetUser = supabase.from as jest.Mock
      
      // Mock uppercase table error, then lowercase success
      mockGetUser
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockRejectedValue(new Error('relation "User" does not exist'))
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_id: 123, email: 'test@example.com' },
                error: null
              })
            })
          })
        })

      render(
        <TestWrapper>
          <AuthFlowTestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      // Should handle both table name cases
      expect(mockGetUser).toHaveBeenCalled()
    })
  })

  describe('State Management Consistency', () => {
    test('should maintain consistent user state across operations', async () => {
      const mockSignIn = supabase.auth.signInWithPassword as jest.Mock
      const mockGetSession = supabase.auth.getSession as jest.Mock
      const mockGetUser = supabase.from as jest.Mock
      const mockSignOut = supabase.auth.signOut as jest.Mock
      
      // Mock successful signin
      mockSignIn.mockResolvedValue({
        data: { user: { email: 'test@example.com' } },
        error: null
      })
      
      // Mock session
      mockGetSession.mockResolvedValue({
        data: { session: { user: { email: 'test@example.com' } } }
      })
      
      // Mock user from custom table
      mockGetUser.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: 123, email: 'test@example.com' },
              error: null
            })
          })
        })
      })
      
      // Mock successful signout
      mockSignOut.mockResolvedValue({ error: null })

      render(
        <TestWrapper>
          <AuthFlowTestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      // Login
      const loginBtn = screen.getByTestId('login-btn')
      fireEvent.click(loginBtn)

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('User: test@example.com')
      })

      // Logout
      const logoutBtn = screen.getByTestId('logout-btn')
      fireEvent.click(logoutBtn)

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No User')
      })
    })
  })
})
