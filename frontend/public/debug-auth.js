// 🔍 Simple Authentication Debug Script
// Run this in your browser console to debug the auth issue

console.log('🔍 Authentication Debug Script Loaded')

// Function to test registration step by step
async function debugRegistration() {
  console.log('=== REGISTRATION DEBUG START ===')
  
  if (!window.authContext) {
    console.error('❌ Auth context not available')
    return
  }
  
  // Try different email formats to see which ones Supabase accepts
  const emailFormats = [
    `test${Date.now()}@gmail.com`,
    `test${Date.now()}@yahoo.com`,
    `test${Date.now()}@outlook.com`,
    `test${Date.now()}@hotmail.com`
  ]
  
  const testEmail = emailFormats[0] // Start with Gmail
  const testPassword = 'TestPassword123!'
  
  console.log('📧 Test email:', testEmail)
  console.log('🔑 Test password:', testPassword)
  
  try {
    // Step 1: Try to register
    console.log('📝 Step 1: Attempting registration...')
    const result = await window.authContext.register('Test', 'User', testEmail, testPassword)
    
    console.log('📝 Registration result:', result)
    
    if (result.error) {
      console.error('❌ Registration failed:', result.error)
      
      // Step 2: Debug the auth state
      console.log('🔍 Step 2: Debugging auth state...')
      const debugResult = await window.authContext.debugAuthState(testEmail)
      console.log('🔍 Debug result:', debugResult)
      
      // Step 3: Try to login anyway to see what happens
      console.log('🔑 Step 3: Trying to login with failed registration...')
      try {
        const loginResult = await window.authContext.login(testEmail, testPassword)
        console.log('🔑 Login result:', loginResult)
      } catch (loginError) {
        console.error('🔑 Login error:', loginError)
      }
      
    } else {
      console.log('✅ Registration successful:', result.success)
      
      // Step 2: Try to login
      console.log('🔑 Step 2: Attempting login...')
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait a bit
      
      const loginResult = await window.authContext.login(testEmail, testPassword)
      console.log('🔑 Login result:', loginResult)
      
      if (loginResult.error) {
        console.error('❌ Login failed after successful registration:', loginResult.error)
        
        // Step 3: Debug the auth state
        console.log('🔍 Step 3: Debugging auth state after failed login...')
        const debugResult = await window.authContext.debugAuthState(testEmail)
        console.log('🔍 Debug result:', debugResult)
      } else {
        console.log('✅ Login successful after registration!')
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error)
  }
  
  console.log('=== REGISTRATION DEBUG END ===')
}

// Function to check existing user
async function checkExistingUser(email) {
  console.log('🔍 Checking existing user:', email)
  
  if (!window.authContext) {
    console.error('❌ Auth context not available')
    return
  }
  
  try {
    const debugResult = await window.authContext.debugAuthState(email)
    console.log('🔍 User state:', debugResult)
    return debugResult
  } catch (error) {
    console.error('❌ Check error:', error)
    return null
  }
}

// Function to test different email formats
async function testEmailFormats() {
  console.log('🔍 Testing different email formats...')
  
  if (!window.authContext) {
    console.error('❌ Auth context not available')
    return
  }
  
  const emailFormats = [
    `test${Date.now()}@gmail.com`,
    `test${Date.now()}@yahoo.com`,
    `test${Date.now()}@outlook.com`,
    `test${Date.now()}@hotmail.com`,
    `test${Date.now()}@example.com`,
    `test${Date.now()}@test.com`
  ]
  
  for (let i = 0; i < emailFormats.length; i++) {
    const email = emailFormats[i]
    console.log(`\n📧 Testing email format ${i + 1}: ${email}`)
    
    try {
      const result = await window.authContext.register('Test', 'User', email, 'TestPassword123!')
      
      if (result.error) {
        console.log(`❌ Failed: ${result.error}`)
        
        // If it's an email validation error, try the next format
        if (result.error.includes('email') || result.error.includes('invalid')) {
          continue
        }
      } else {
        console.log(`✅ Success with: ${email}`)
        console.log('This email format works!')
        return email
      }
    } catch (error) {
      console.error(`❌ Error with ${email}:`, error)
    }
  }
  
  console.log('\n❌ All email formats failed. There might be a Supabase configuration issue.')
  return null
}

// Export functions to window
window.debugRegistration = debugRegistration
window.checkExistingUser = checkExistingUser
window.testEmailFormats = testEmailFormats

console.log('✅ Debug functions available:')
console.log('- debugRegistration() - Test complete registration flow')
console.log('- checkExistingUser(email) - Check specific user state')
console.log('- testEmailFormats() - Test different email formats to find working ones')
console.log('')
console.log('💡 Run testEmailFormats() to find which email formats work')
console.log('💡 Run debugRegistration() to test the complete flow')
