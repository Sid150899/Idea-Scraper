#!/bin/bash
# Simple pipeline execution script that calls the 2 APIs and saves the complete response

APP_NAME="idea_agent"
USER_ID="test"
SESSION_ID="test-$(date +%s)"
API_URL="http://localhost:8000"

echo "🚀 Starting Idea Extraction Pipeline..."

# Step 1: Create a session
echo "Creating session with ID: $SESSION_ID"

SESSION_RESPONSE=$(curl -s -X POST "$API_URL/apps/$APP_NAME/users/$USER_ID/sessions/$SESSION_ID" \
-H "Content-Type: application/json" \
-d '{}')

echo "Session creation response:"
echo "$SESSION_RESPONSE"

# Check if session was created successfully
if echo "$SESSION_RESPONSE" | jq -e '.id' >/dev/null 2>&1; then
    echo "✅ Session created successfully"
else
    echo "❌ Failed to create session. Exiting..."
    exit 1
fi

sleep 2

# Step 2: Run the pipeline
echo "Running the complete idea extraction pipeline..."

RESPONSE=$(curl -s -X POST "$API_URL/run" \
-H "Content-Type: application/json" \
-d "{
\"app_name\": \"$APP_NAME\",
\"user_id\": \"$USER_ID\",
\"session_id\": \"$SESSION_ID\",
\"new_message\": {
\"parts\": [{\"text\": \"Run the complete idea extraction pipeline to scrape startup ideas from reddit and generate detailed analysis\"}],
\"role\": \"user\"
}
}")

echo ""
echo "============================================================"
echo "PIPELINE RESPONSE RECEIVED"
echo "============================================================"
echo "Response length: ${#RESPONSE} characters"

# Save the complete response to a file
echo "$RESPONSE" > "pipeline_response.txt"
echo ""
echo "✅ Complete response saved to pipeline_response.txt"
echo ""
echo "🎉 Pipeline execution completed!"
echo ""
echo "📁 Next step: Run the extraction script to process the response:"
echo "   python3 extract_responses.py"
