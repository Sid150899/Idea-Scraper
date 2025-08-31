// 🔐 Authentication Flow Test Script
// Run this in your browser console to test the complete auth flow

console.log('🧪 Starting Authentication Flow Test...')

// Test configuration
const TEST_CONFIG = {
  firstName: 'Test',
  lastName: 'User',
  email: `test${Date.now()}@example.com`, // Unique email for each test
  password: 'TestPassword123!',
  timeout: 10000 // 10 seconds
}

// Test results
let testResults = {
  registration: { success: false, error: null, user: null },
  login: { success: false, error: null, user: null },
  logout: { success: false, error: null },
  cache: { cleared: false, staleData: false }
}

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Test 1: Registration
async function testRegistration() {
  console.log('📝 Test 1: User Registration')
  console.log('Email:', TEST_CONFIG.email)
  
  try {
    // Get auth context
    const authContext = window.authContext || window.useAuth?.()
    if (!authContext) {
      throw new Error('Auth context not available')
    }
    
    // Clear any existing cache
    if (authContext.clearStaleCache) {
      authContext.clearStaleCache()
      testResults.cache.cleared = true
    }
    
    // Attempt registration
    const result = await authContext.register(
      TEST_CONFIG.firstName,
      TEST_CONFIG.lastName,
      TEST_CONFIG.email,
      TEST_CONFIG.password
    )
    
    if (result.error) {
      testResults.registration.error = result.error
      console.error('❌ Registration failed:', result.error)
      return false
    }
    
    if (result.success) {
      testResults.registration.success = true
      console.log('✅ Registration successful:', result.success)
      return true
    }
    
    console.warn('⚠️ Registration returned no error but no success message')
    return false
    
  } catch (error) {
    testResults.registration.error = error.message
    console.error('❌ Registration exception:', error)
    return false
  }
}

// Test 2: Login
async function testLogin() {
  console.log('🔑 Test 2: User Login')
  
  try {
    const authContext = window.authContext || window.useAuth?.()
    if (!authContext) {
      throw new Error('Auth context not available')
    }
    
    // Wait a moment for any async operations to complete
    await wait(1000)
    
    // Attempt login
    const result = await authContext.login(
      TEST_CONFIG.email,
      TEST_CONFIG.password
    )
    
    if (result.error) {
      testResults.login.error = result.error
      console.error('❌ Login failed:', result.error)
      return false
    }
    
    // Check if user is set
    await wait(1000) // Wait for user state to update
    
    if (authContext.user) {
      testResults.login.success = true
      testResults.login.user = authContext.user
      console.log('✅ Login successful:', authContext.user)
      return true
    } else {
      console.error('❌ Login succeeded but no user set')
      return false
    }
    
  } catch (error) {
    testResults.login.error = error.message
    console.error('❌ Login exception:', error)
    return false
  }
}

// Test 3: Logout
async function testLogout() {
  console.log('🚪 Test 3: User Logout')
  
  try {
    const authContext = window.authContext || window.useAuth?.()
    if (!authContext) {
      throw new Error('Auth context not available')
    }
    
    // Attempt logout
    await authContext.logout()
    
    // Wait for logout to complete
    await wait(1000)
    
    if (!authContext.user) {
      testResults.logout.success = true
      console.log('✅ Logout successful')
      return true
    } else {
      console.error('❌ Logout failed - user still exists')
      return false
    }
    
  } catch (error) {
    testResults.logout.error = error.message
    console.error('❌ Logout exception:', error)
    return false
  }
}

// Test 4: Cache Validation
async function testCacheValidation() {
  console.log('🗄️ Test 4: Cache Validation')
  
  try {
    const authContext = window.authContext || window.useAuth?.()
    if (!authContext) {
      throw new Error('Auth context not available')
    }
    
    // Try to get user from cache after logout
    if (authContext.clearStaleCache) {
      authContext.clearStaleCache(TEST_CONFIG.email)
      console.log('✅ Cache cleared for test email')
    }
    
    // Check if there are any stale references
    if (authContext.user) {
      testResults.cache.staleData = true
      console.warn('⚠️ Stale user data detected after logout')
    } else {
      console.log('✅ No stale user data detected')
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Cache validation error:', error)
    return false
  }
}

// Main test runner
async function runAuthFlowTest() {
  console.log('🚀 Starting Authentication Flow Test Suite...')
  console.log('=============================================')
  
  const startTime = Date.now()
  
  try {
    // Test 1: Registration
    const regSuccess = await testRegistration()
    if (!regSuccess) {
      console.log('⏭️ Skipping remaining tests due to registration failure')
      return
    }
    
    // Wait between tests
    await wait(2000)
    
    // Test 2: Login
    const loginSuccess = await testLogin()
    if (!loginSuccess) {
      console.log('⏭️ Skipping remaining tests due to login failure')
      return
    }
    
    // Wait between tests
    await wait(2000)
    
    // Test 3: Logout
    await testLogout()
    
    // Wait between tests
    await wait(1000)
    
    // Test 4: Cache Validation
    await testCacheValidation()
    
    // Test Summary
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log('')
    console.log('📊 Test Results Summary')
    console.log('=======================')
    console.log('Duration:', duration, 'ms')
    console.log('Registration:', testResults.registration.success ? '✅ PASS' : '❌ FAIL')
    console.log('Login:', testResults.login.success ? '✅ PASS' : '❌ FAIL')
    console.log('Logout:', testResults.logout.success ? '✅ PASS' : '❌ FAIL')
    console.log('Cache Management:', testResults.cache.cleared ? '✅ PASS' : '❌ FAIL')
    
    if (testResults.registration.error) {
      console.log('Registration Error:', testResults.registration.error)
    }
    if (testResults.login.error) {
      console.log('Login Error:', testResults.login.error)
    }
    if (testResults.logout.error) {
      console.log('Logout Error:', testResults.logout.error)
    }
    
    // Overall result
    const overallSuccess = testResults.registration.success && 
                          testResults.login.success && 
                          testResults.logout.success
    
    console.log('')
    console.log(overallSuccess ? '🎉 ALL TESTS PASSED!' : '💥 SOME TESTS FAILED!')
    
  } catch (error) {
    console.error('❌ Test suite failed with error:', error)
  }
}

// Export for manual testing
window.runAuthFlowTest = runAuthFlowTest
window.testResults = testResults

console.log('✅ Test script loaded! Run "runAuthFlowTest()" to start testing.')
console.log('📧 Test email:', TEST_CONFIG.email)
console.log('🔑 Test password:', TEST_CONFIG.password)
