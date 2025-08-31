#!/bin/bash

echo "🧪 Running Authentication Flow Tests..."
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run the tests
echo "🚀 Starting test suite..."
npm test -- --testPathPattern="AuthContext|AuthFlow" --verbose --no-coverage --watchAll=false

echo ""
echo "✅ Tests completed!"
echo ""
echo "📋 Test Summary:"
echo "- AuthContext.test.tsx: Basic authentication functionality tests"
echo "- AuthFlow.test.tsx: Authentication flow consistency tests"
echo ""
echo "🔍 If you see any failures, check the output above for specific error details."
