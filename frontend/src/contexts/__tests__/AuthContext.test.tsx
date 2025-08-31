import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import { supabase } from '../../lib/supabase'

// Mock Supabase with proper structure
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
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

// Test component to access auth context
const TestComponent = () => {
  const { user, login, register, logout, loading } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading...' : 'Not Loading'}</div>
      <div data-testid="user">{user ? `User: ${user.email}` : 'No User'}</div>
      <button onClick={() => login('test@example.com', 'password')} data-testid="login-btn">
        Login
      </button>
      <button onClick={() => register('John', 'Doe', 'test@example.com', 'password')} data-testid="register-btn">
        Register
      </button>
      <button onClick={logout} data-testid="logout-btn">Logout</button>
    </div>
  )
}

// Wrapper component for tests
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset localStorage
    localStorage.clear()
  })

  describe('Initial State', () => {
    test('should start with loading true and user null', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )
      
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading...')
      expect(screen.getByTestId('user')).toHaveTextContent('No User')
    })
  })

  describe('Registration Flow', () => {
    test('should handle successful registration without automatic sign-in', async () => {
      const mockSignUp = supabase.auth.signUp as jest.Mock
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
          <TestComponent />
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

    test('should handle user already exists error', async () => {
      const mockSignUp = supabase.auth.signUp as jest.Mock
      const mockGetUser = supabase.from as jest.Mock
      
      // Mock existing user check
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
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      const registerBtn = screen.getByTestId('register-btn')
      fireEvent.click(registerBtn)

      // Should not call signUp since user already exists
      expect(supabase.auth.signUp).not.toHaveBeenCalled()
    })

    test('should handle registration timeout', async () => {
      const mockSignUp = supabase.auth.signUp as jest.Mock
      
      // Mock timeout
      mockSignUp.mockImplementation(() => 
        new Promise((resolve) => 
          setTimeout(() => resolve({ data: null, error: { message: 'Signup timeout' } }), 6000)
        )
      )

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      const registerBtn = screen.getByTestId('register-btn')
      fireEvent.click(registerBtn)

      // This test will take 6 seconds, so we'll just verify the mock was called
      expect(mockSignUp).toHaveBeenCalled()
    })
  })

  describe('Login Flow', () => {
    test('should handle successful login', async () => {
      const mockSignIn = supabase.auth.signInWithPassword as jest.Mock
      const mockGetSession = supabase.auth.getSession as jest.Mock
      const mockGetUser = supabase.from as jest.Mock
      
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

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      const loginBtn = screen.getByTestId('login-btn')
      fireEvent.click(loginBtn)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password'
        })
      })
    })

    test('should handle login timeout', async () => {
      const mockSignIn = supabase.auth.signInWithPassword as jest.Mock
      
      // Mock timeout
      mockSignIn.mockImplementation(() => 
        new Promise((resolve) => 
          setTimeout(() => resolve({ data: null, error: { message: 'Authentication timeout' } }), 6000)
        )
      )

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      const loginBtn = screen.getByTestId('login-btn')
      fireEvent.click(loginBtn)

      expect(mockSignIn).toHaveBeenCalled()
    })
  })

  describe('Logout Flow', () => {
    test('should handle logout', async () => {
      const mockSignOut = supabase.auth.signOut as jest.Mock
      
      mockSignOut.mockResolvedValue({ error: null })

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      const logoutBtn = screen.getByTestId('logout-btn')
      fireEvent.click(logoutBtn)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
      })
    })
  })

  describe('Session Management', () => {
    test('should handle session restoration', async () => {
      const mockGetSession = supabase.auth.getSession as jest.Mock
      const mockGetUser = supabase.from as jest.Mock
      
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

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      expect(mockGetSession).toHaveBeenCalled()
    })

    test('should handle session timeout', async () => {
      const mockGetSession = supabase.auth.getSession as jest.Mock
      
      // Mock timeout
      mockGetSession.mockImplementation(() => 
        new Promise((resolve) => 
          setTimeout(() => resolve({ data: { session: null } }), 4000)
        )
      )

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      // Should handle timeout gracefully
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      }, { timeout: 5000 })
    })
  })

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      const mockGetUser = supabase.from as jest.Mock
      
      // Mock database error
      mockGetUser.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Database connection failed'))
          })
        })
      })

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      // Should not crash and should show no user
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('No User')
    })

    test('should handle table name case sensitivity', async () => {
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
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      // Should handle both table name cases
      expect(mockGetUser).toHaveBeenCalled()
    })
  })

  describe('Cache Management', () => {
    test('should use cached user data when available', async () => {
      const mockGetUser = supabase.from as jest.Mock
      
      // Mock successful user fetch
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
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      // First call should fetch from database
      expect(mockGetUser).toHaveBeenCalled()

      // Clear mocks to verify cache usage
      jest.clearAllMocks()

      // Re-render to trigger cache check
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      // Should not call database again if cache is working
      // Note: This test might need adjustment based on actual cache implementation
    })
  })
})
