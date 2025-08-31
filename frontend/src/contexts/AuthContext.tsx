import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, User } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ error: string | null }>
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<{ error: string | null, success?: string }>
  logout: () => Promise<void>
  loading: boolean
  clearStaleCache: (email?: string) => void
  debugAuthState: (email: string) => Promise<{ session: boolean; customUser: boolean; cachedUser: boolean } | { error: string }>
  checkSupabaseConfig: () => Promise<{ success: string } | { error: string }>
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
          .from(USER_TABLE)
          .select('*')
          .limit(1)
        
        if (tableError) {
          console.error('Error accessing User table:', tableError)
          return null
        } else {
          console.log('Found User table')
        }
      } catch (tableCheckError) {
        console.error('Error checking table structure:', tableCheckError)
      }
      
      // Use the Supabase Auth user ID to maintain consistency
      const user_id = authUser.id
      
      console.log('Using Supabase Auth user_id:', user_id, 'Type:', typeof user_id)
      
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

      console.log('Attempting to insert user data:', userData)
      
      // Insert using standardized table name with timeout
      const insertPromise = supabase
        .from(USER_TABLE)
        .insert([userData])
        .select()
        .single()

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database timeout')), DB_TIMEOUT)
      })

      const { data, error } = await Promise.race([insertPromise, timeoutPromise])

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
      
      // Handle timeout errors specifically
      if (error instanceof Error && error.message === 'Database timeout') {
        console.error('Database operation timed out. This might be due to:')
        console.error('1. Network connectivity issues')
        console.error('2. Supabase service being slow')
        console.error('3. Database being overloaded')
        console.error('4. Foreign key constraint issues (like the UUID vs integer problem)')
      }
      
      return null
    }
  }

  // Function to get user from custom User table with caching
  const getUserFromCustomTable = async (email: string) => {
    try {
      // Check cache first, but only if we have a valid user
      if (userCache.has(email)) {
        const cachedUser = userCache.get(email)
        if (cachedUser) {
          console.log('Using cached user for:', email)
          return cachedUser
        }
      }

      // Fetch from database with timeout
      const fetchPromise = supabase
        .from(USER_TABLE)
        .select('*')
        .eq('email', email)
        .single()

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database timeout')), DB_TIMEOUT)
      })

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
      
      // Handle timeout errors specifically
      if (error instanceof Error && error.message === 'Database timeout') {
        console.error('Database fetch operation timed out. This might be due to:')
        console.error('1. Network connectivity issues')
        console.error('2. Supabase service being slow')
        console.error('3. Database being overloaded')
        console.error('4. Foreign key constraint issues (like the UUID vs integer problem)')
      }
      
      return null
    }
  }

  // Constants for consistent configuration
  const AUTH_TIMEOUT = 10000; // 10 seconds
  const DB_TIMEOUT = 8000;    // 8 seconds
  const USER_TABLE = 'User';  // Standardized table name

  // Function to handle authentication errors consistently
  const handleAuthError = (error: any, operation: string) => {
    console.error(`Authentication error during ${operation}:`, error)
    
    // Check if the error indicates user already exists by email
    if (error?.message?.toLowerCase().includes('already registered') ||
        error?.message?.toLowerCase().includes('already exists') ||
        error?.message?.toLowerCase().includes('already been registered') ||
        error?.message?.toLowerCase().includes('user already exists') ||
        error?.message?.toLowerCase().includes('email already in use') ||
        error?.code === '23505' || // PostgreSQL unique constraint violation
        error?.code === '23514' || // PostgreSQL check constraint violation
        error?.status === 400) { // Bad request often means user exists
      return 'User already exists, please login'
    }
    
    return error?.message || 'An unexpected error occurred'
  }

  // Function to retry operations with exponential backoff
  const retryOperation = async (
    operation: () => Promise<any>, 
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<any> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        if (attempt === maxRetries) {
          throw error
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1) // Exponential backoff
        console.log(`Operation failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    throw new Error('Max retries exceeded')
  }

  // Function to update last_login timestamp in User table
  const updateLastLogin = async (userId: number) => {
    try {
      console.log('Updating last_login for user:', userId)
      
      const currentTimestamp = new Date().toISOString()
      
      // Update the last_login column using standardized table name
      const { error } = await supabase
        .from(USER_TABLE)
        .update({ last_login: currentTimestamp })
        .eq('user_id', userId)
      
      if (error) {
        console.error('Error updating last_login in User table:', error)
        // Don't fail the login if this update fails
        return false
      }
      
      console.log('Successfully updated last_login timestamp in User table')
      return true
    } catch (error) {
      console.error('Error updating last_login:', error)
      // Don't fail the login if this update fails
      return false
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
              // Update last_login timestamp
              updateLastLogin(cachedUser.user_id)
              setLoading(false)
              return
            }
          }
          
                   // Fallback to database fetch with timeout
         try {
           const fetchTimeout = new Promise<never>((_, reject) => {
             setTimeout(() => reject(new Error('User fetch timeout')), DB_TIMEOUT)
           })
            
            const fetchPromise = getUserFromCustomTable(session.user.email || '')
            const customUser = await Promise.race([fetchPromise, fetchTimeout])
            
            if (customUser) {
              setUser(customUser)
              // Update last_login timestamp
              updateLastLogin(customUser.user_id)
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
      console.log('Attempting login for email:', email)
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Authentication timeout')), AUTH_TIMEOUT)
      })

      const authPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })

      const result = await Promise.race([authPromise, timeoutPromise])
      const { error, data } = result

      if (error) {
        console.error('Login error:', error)
        return { error: error.message }
      }

      console.log('Supabase Auth login successful:', {
        userId: data?.user?.id,
        email: data?.user?.email,
        confirmed: data?.user?.email_confirmed_at
      })

      // Check if user is confirmed (temporarily disabled for debugging)
      if (data?.user && !data.user.email_confirmed_at) {
        console.warn('User email not confirmed, but allowing login for debugging:', data.user.email)
        // return { error: 'Please check your email and confirm your account before logging in.' }
      }

      // Quick user setup after successful login with timeout
      try {
        const userSetupPromise = (async () => {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            console.log('Setting up user after successful login:', session.user.email)
            
            // Check cache first for immediate response
            if (userCache.has(session.user.email || '')) {
              const cachedUser = userCache.get(session.user.email || '')
              if (cachedUser) {
                console.log('Using cached user for immediate response')
                setUser(cachedUser)
                updateLastLogin(cachedUser.user_id)
                return
              }
            }
            
            // Quick database check with timeout
            console.log('Looking up custom user for email:', session.user.email)
            const customUser = await getUserFromCustomTable(session.user.email || '')
            if (customUser) {
              console.log('Found custom user:', customUser)
              setUser(customUser)
              // Update last_login timestamp
              updateLastLogin(customUser.user_id)
            } else {
              console.warn('No custom user found for authenticated email:', session.user.email)
              // Clear any stale cache for this email
              clearStaleCache(session.user.email)
            }
          }
        })()

                 const userSetupTimeout = new Promise<never>((_, reject) => {
           setTimeout(() => reject(new Error('User setup timeout')), DB_TIMEOUT)
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
      console.log('=== REGISTRATION START ===')
      console.log('Attempting registration for:', { firstName, lastName, email })
      
      // Clear any stale cache for this email first
      setUserCache(prev => {
        const newCache = new Map(prev)
        newCache.delete(email)
        return newCache
      })
      
      // Don't check custom table first - let Supabase Auth handle existing user detection
      // This prevents false positives from stale cache or database state
      
                 // Sign up with Supabase directly with timeout
           const signupTimeout = new Promise<never>((_, reject) => {
             setTimeout(() => reject(new Error('Signup timeout')), AUTH_TIMEOUT)
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
        console.log('=== SIGNUP ERROR ANALYSIS ===')
        console.log('Error Object:', signUpError)
        console.log('Error Code:', signUpError.code)
        console.log('Error Message:', signUpError.message)
        console.log('Error Status:', signUpError.status)
        
        // Check the specific error type and handle accordingly
        if (signUpError.code === 'email_address_invalid') {
          console.log('Email address rejected by Supabase as invalid')
          return { error: 'Email address format is not accepted. Please use a different email address.' }
        }
        
        if (signUpError.code === 'user_already_exists' || 
            signUpError.message?.toLowerCase().includes('already registered') || 
            signUpError.message?.toLowerCase().includes('already exists') ||
            signUpError.message?.toLowerCase().includes('already been registered') ||
            signUpError.message?.toLowerCase().includes('user already exists') ||
            signUpError.message?.toLowerCase().includes('email already in use')) {
          
          console.log('User already exists detected. Checking if we can recover...')
          
          // Try to sign in with the existing credentials to see if it's a confirmation issue
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password
            })
            
            if (signInError) {
              console.log('Sign in failed with existing user:', signInError.message)
              return { error: 'User already exists, please login' }
            }
            
            if (signInData?.user) {
              console.log('Existing user found, checking if custom table entry exists...')
              
              // Check if user exists in custom table
              const existingCustomUser = await getUserFromCustomTable(email)
              
              if (existingCustomUser) {
                console.log('User exists in both systems, returning success')
                return { error: null, success: 'User already exists, please login' }
              } else {
                console.log('User exists in Supabase Auth but not in custom table. Creating custom table entry...')
                
                // Create the missing custom table entry
                const customUser = await createUserInCustomTable(signInData.user, firstName, lastName)
                
                if (customUser) {
                  console.log('Custom table entry created successfully')
                  return { error: null, success: 'User setup completed, please login' }
                } else {
                  console.log('Failed to create custom table entry')
                  return { error: 'User exists but profile setup failed. Please contact support.' }
                }
              }
            }
          } catch (recoveryError) {
            console.error('Error during recovery attempt:', recoveryError)
            return { error: 'User already exists, please login' }
          }
        }
        
        // Handle other specific error types
        if (signUpError.code === 'weak_password') {
          return { error: 'Password is too weak. Please use a stronger password.' }
        }
        
        if (signUpError.code === 'invalid_email') {
          return { error: 'Email address format is invalid. Please check your email address.' }
        }
        
        console.error('Supabase Auth signup failed with error:', signUpError)
        return { error: signUpError.message }
      }

      // Verify that we have a valid user from Supabase Auth
      if (!data?.user) {
        console.error('Supabase Auth signup succeeded but no user data returned')
        return { error: 'User registration failed. Please try again.' }
      }

      console.log('Supabase Auth user created successfully:', {
        id: data.user.id,
        email: data.user.email,
        confirmed: data.user.email_confirmed_at
      })

                   // If signup successful, create user in custom table with timeout
             if (data.user) {
               const userCreationTimeout = new Promise<never>((_, reject) => {
                 setTimeout(() => reject(new Error('User creation timeout')), DB_TIMEOUT)
               })

        try {
          console.log('Creating user in custom table...')
          const customUser = await Promise.race([
            createUserInCustomTable(data.user, firstName, lastName),
            userCreationTimeout
          ])
          
          if (!customUser) {
            console.error('createUserInCustomTable returned null')
            // Note: Cannot clean up Supabase Auth user from client-side
            // The user will need to be cleaned up manually or through a backend process
            console.warn('Supabase Auth user created but custom table creation failed')
            return { error: 'Failed to create user profile. Please try again.' }
          }
          
          console.log('User created successfully in custom table:', customUser)
          
          // Verify the user was created with the correct ID
          if (customUser.user_id !== data.user.id) {
            console.error('User ID mismatch:', {
              supabaseAuthId: data.user.id,
              customTableId: customUser.user_id
            })
            // Clean up the custom table user since it has wrong ID
            try {
              await supabase.from(USER_TABLE).delete().eq('user_id', customUser.user_id)
              console.log('Cleaned up custom table user after ID mismatch')
            } catch (cleanupError) {
              console.warn('Could not clean up custom table user:', cleanupError)
            }
            return { error: 'User profile creation failed. Please try again.' }
          }
          
          console.log('✅ User registration completed successfully!')
        } catch (creationError: any) {
          console.error('Error during user creation:', creationError)
          if (creationError?.message === 'User creation timeout') {
            console.warn('User creation took too long')
            // Note: Cannot clean up Supabase Auth user from client-side
            return { error: 'Registration timed out. Please try again.' }
          } else {
            // Note: Cannot clean up Supabase Auth user from client-side
            return { error: 'Failed to create user profile. Please try again.' }
          }
        }

        // Don't attempt automatic sign-in, just return success
        console.log('User registered successfully, returning success message')
      }

      return { error: null, success: 'User registered, please login' }
    } catch (error: any) {
      if (error?.message === 'Signup timeout') {
        return { error: 'Registration is taking too long. Please try again.' }
      }
      if (error?.message === 'User creation timeout') {
        return { error: 'Registration successful but user setup is taking too long. Please try logging in manually.' }
      }
      return { error: 'An unexpected error occurred' }
    }
  }

  const logout = async () => {
    try {
      console.log('Logging out user...')
      await supabase.auth.signOut()
      setUser(null)
      // Clear cache on logout
      setUserCache(new Map())
      console.log('User logged out and cache cleared')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Function to clear stale cache entries
  const clearStaleCache = (email?: string) => {
    if (email) {
      setUserCache(prev => {
        const newCache = new Map(prev)
        newCache.delete(email)
        return newCache
      })
      console.log('Cleared cache for email:', email)
    } else {
      setUserCache(new Map())
      console.log('Cleared entire user cache')
    }
  }

  // Function to debug authentication state
  const debugAuthState = async (email: string) => {
    console.log('=== AUTH STATE DEBUG ===')
    console.log('Email:', email)
    
    try {
      // Check Supabase Auth session
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Current Supabase session:', session ? 'Active' : 'None')
      if (session?.user) {
        console.log('Session user:', {
          id: session.user.id,
          email: session.user.email,
          confirmed: session.user.email_confirmed_at
        })
      }
      
      // Check custom table
      const customUser = await getUserFromCustomTable(email)
      console.log('Custom table user:', customUser ? 'Found' : 'Not found')
      if (customUser) {
        console.log('Custom user details:', customUser)
      }
      
      // Check cache
      const cachedUser = userCache.get(email)
      console.log('Cached user:', cachedUser ? 'Found' : 'Not found')
      if (cachedUser) {
        console.log('Cached user details:', cachedUser)
      }
      
      console.log('=== END DEBUG ===')
      
      return {
        session: !!session,
        customUser: !!customUser,
        cachedUser: !!cachedUser
      }
    } catch (error) {
      console.error('Debug error:', error)
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Function to check Supabase configuration
  const checkSupabaseConfig = async () => {
    console.log('=== SUPABASE CONFIG CHECK ===')
    
    try {
      // Check if we can access Supabase
      console.log('Supabase client available:', !!supabase)
      console.log('Supabase auth available:', !!supabase.auth)
      
      // Try a simple auth operation to check configuration
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Supabase auth error:', error)
        return { error: error.message }
      }
      
      console.log('Supabase auth connection:', 'Working')
      
      // Check if we can access the database
      try {
        const { data: tableCheck, error: tableError } = await supabase
          .from(USER_TABLE)
          .select('count')
          .limit(1)
        
        if (tableError) {
          console.error('Database access error:', tableError)
          return { error: `Database access failed: ${tableError.message}` }
        }
        
        console.log('Database access:', 'Working')
        return { success: 'Supabase configuration is working correctly' }
        
      } catch (dbError) {
        console.error('Database check error:', dbError)
        return { error: `Database check failed: ${dbError}` }
      }
      
    } catch (error) {
      console.error('Config check error:', error)
      return { error: `Config check failed: ${error}` }
    }
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    clearStaleCache,
    debugAuthState,
    checkSupabaseConfig,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
