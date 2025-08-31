import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, User } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ error: string | null }>
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userCache, setUserCache] = useState<Map<string, User>>(new Map())

  // Function to create user in custom User table
  const createUserInCustomTable = async (authUser: any, firstName: string, lastName: string) => {
    try {
      // First, let's check if the User table exists and what its structure is
      console.log('Checking User table structure...')
      try {
        const { data: tableInfo, error: tableError } = await supabase
          .from('User')
          .select('*')
          .limit(1)
        
        if (tableError) {
          console.error('Error accessing User table:', tableError)
          // Try with lowercase 'user' as fallback
          const { data: lowerTableInfo, error: lowerTableError } = await supabase
            .from('user')
            .select('*')
            .limit(1)
          
          if (lowerTableError) {
            console.error('Error accessing user table (lowercase):', lowerTableError)
            return null
          } else {
            console.log('Found user table (lowercase)')
          }
        } else {
          console.log('Found User table (uppercase)')
        }
      } catch (tableCheckError) {
        console.error('Error checking table structure:', tableCheckError)
      }
      
      // Generate a unique integer user_id using timestamp and random component
      let user_id: number
      let attempts = 0
      const maxAttempts = 5
      
      do {
        const timestamp = Date.now()
        const random = Math.floor(Math.random() * 1000)
        user_id = timestamp + random
        attempts++
        
        // Check if user_id already exists (with timeout)
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 3000)
        })
        
        let checkPromise = supabase
          .from('User')
          .select('user_id')
          .eq('user_id', user_id)
          .single()

        try {
          const { data: existingUser } = await Promise.race([checkPromise, timeoutPromise])
          if (!existingUser) break
        } catch (error) {
          // If User table fails, try user table
          if (error && typeof error === 'object' && 'message' in error && 
              typeof (error as any).message === 'string' && 
              (error as any).message.includes('relation') && (error as any).message.includes('User')) {
            console.log('Trying user ID check with lowercase table...')
            checkPromise = supabase
              .from('user')
              .select('user_id')
              .eq('user_id', user_id)
              .single()
            
            const { data: existingUserLower } = await Promise.race([checkPromise, timeoutPromise])
            if (!existingUserLower) break
          } else {
            // If timeout or other error, assume user_id is available
            break
          }
        }
      } while (attempts < maxAttempts)
      
      if (attempts >= maxAttempts) {
        console.error('Failed to generate unique user_id after multiple attempts')
        return null
      }
      
      const userData = {
        user_id: user_id,
        first_name: firstName,
        last_name: lastName,
        email: authUser.email || '',
        password_hash: '',
        last_session_refresh: new Date().toISOString(),
        is_paid: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Insert into custom User table with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      })
      
      console.log('Attempting to insert user data:', userData)
      
      // Try with uppercase 'User' first, then lowercase 'user' as fallback
      let insertPromise = supabase
        .from('User')
        .insert([userData])
        .select()
        .single()

      let { data, error } = await Promise.race([insertPromise, timeoutPromise])

      // If uppercase fails, try lowercase
      if (error && error.message.includes('relation') && error.message.includes('User')) {
        console.log('Trying with lowercase table name...')
        insertPromise = supabase
          .from('user')
          .insert([userData])
          .select()
          .single()

        const result = await Promise.race([insertPromise, timeoutPromise])
        data = result.data
        error = result.error
      }

      if (error) {
        console.error('Error creating user in custom table:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return null
      }

      // Cache the new user
      setUserCache(prev => new Map(prev).set(authUser.email || '', data))
      return data
    } catch (error) {
      console.error('Error creating user in custom table:', error)
      return null
    }
  }

  // Function to get user from custom User table with caching
  const getUserFromCustomTable = async (email: string) => {
    try {
      // Check cache first
      if (userCache.has(email)) {
        return userCache.get(email) || null
      }

      // Fetch from database with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database timeout')), 3000)
      })
      
      const fetchPromise = supabase
        .from('User')
        .select('*')
        .eq('email', email)
        .single()

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

      if (error) {
        console.error('Error getting user from custom table:', error)
        return null
      }

      // Cache the user
      setUserCache(prev => new Map(prev).set(email, data))
      return data
    } catch (error) {
      console.error('Error getting user from custom table:', error)
      return null
    }
  }

  useEffect(() => {
    // Check for existing session with aggressive timeout
    const checkUser = async () => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Session check timeout')), 3000) // Reduced to 3 seconds
        })

        const sessionPromise = supabase.auth.getSession()
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise])
        
        if (session?.user) {
          // Get user from custom table with aggressive timeout
          const customUser = await getUserFromCustomTable(session.user.email || '')
          if (customUser) {
            setUser(customUser)
          }
        }
      } catch (error) {
        console.error('Error checking user session:', error)
        // Continue with loading false even if session check fails
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Listen for auth changes with aggressive timeouts
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Quick cache check first
          if (userCache.has(session.user.email || '')) {
            const cachedUser = userCache.get(session.user.email || '')
            if (cachedUser) {
              setUser(cachedUser)
              setLoading(false)
              return
            }
          }
          
          // Fallback to database fetch with timeout
          try {
            const fetchTimeout = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('User fetch timeout')), 3000) // 3 second timeout
            })
            
            const fetchPromise = getUserFromCustomTable(session.user.email || '')
            const customUser = await Promise.race([fetchPromise, fetchTimeout])
            
            if (customUser) {
              setUser(customUser)
            }
          } catch (fetchError) {
            console.error('User fetch timeout, continuing without user data')
            // Continue without user data if fetch times out
          }
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [userCache]) // Added userCache dependency

  const login = async (email: string, password: string) => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Authentication timeout')), 5000) // Reduced to 5 seconds
      })

      const authPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })

      const result = await Promise.race([authPromise, timeoutPromise])
      const { error } = result

      if (error) {
        return { error: error.message }
      }

      // Quick user setup after successful login with timeout
      try {
        const userSetupPromise = (async () => {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            // Check cache first for immediate response
            if (userCache.has(session.user.email || '')) {
              const cachedUser = userCache.get(session.user.email || '')
              if (cachedUser) {
                setUser(cachedUser)
                return
              }
            }
            
            // Quick database check with timeout
            const customUser = await getUserFromCustomTable(session.user.email || '')
            if (customUser) {
              setUser(customUser)
            }
          }
        })()

        const userSetupTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('User setup timeout')), 3000) // 3 second timeout for user setup
        })

        await Promise.race([userSetupPromise, userSetupTimeout])
      } catch (setupError: any) {
        if (setupError?.message === 'User setup timeout') {
          console.warn('User setup took too long, continuing with basic auth')
          // Continue with basic authentication even if user setup times out
        }
      }

      return { error: null }
    } catch (error: any) {
      if (error?.message === 'Authentication timeout') {
        return { error: 'Authentication is taking too long. Please try again.' }
      }
      return { error: 'An unexpected error occurred' }
    }
  }

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    try {
      // Sign up with Supabase directly with timeout
      const signupTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Signup timeout')), 5000) // 5 second timeout
      })

      const signupPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      })

      const { data, error: signUpError } = await Promise.race([signupPromise, signupTimeout])

      if (signUpError) {
        return { error: signUpError.message }
      }

      // If signup successful, create user in custom table with timeout
      if (data.user) {
        const userCreationTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('User creation timeout')), 5000) // 5 second timeout
        })

        try {
          console.log('Creating user in custom table...')
          const customUser = await Promise.race([
            createUserInCustomTable(data.user, firstName, lastName),
            userCreationTimeout
          ])
          
          if (!customUser) {
            console.error('createUserInCustomTable returned null')
            return { error: 'Failed to create user profile. Please try again.' }
          }
          
          console.log('User created successfully in custom table:', customUser)
        } catch (creationError: any) {
          console.error('Error during user creation:', creationError)
          if (creationError?.message === 'User creation timeout') {
            console.warn('User creation took too long, continuing with basic auth')
            // Continue with basic auth even if user creation times out
          } else {
            return { error: 'Failed to create user profile. Please try again.' }
          }
        }

        // Automatically sign in the user with timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Sign-in timeout')), 5000) // Reduced to 5 seconds
        })

        const signInPromise = supabase.auth.signInWithPassword({
          email,
          password,
        })

        const result = await Promise.race([signInPromise, timeoutPromise])
        const { error: signInError } = result

        if (signInError) {
          return { error: 'Registration successful but sign-in is taking too long. Please try logging in manually.' }
        }
      }

      return { error: null }
    } catch (error: any) {
      if (error?.message === 'Signup timeout') {
        return { error: 'Registration is taking too long. Please try again.' }
      }
      if (error?.message === 'Sign-in timeout') {
        return { error: 'Registration successful but sign-in is taking too long. Please try logging in manually.' }
      }
      if (error?.message === 'User creation timeout') {
        return { error: 'Registration successful but user setup is taking too long. Please try logging in manually.' }
      }
      return { error: 'An unexpected error occurred' }
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      // Clear cache on logout
      setUserCache(new Map())
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
