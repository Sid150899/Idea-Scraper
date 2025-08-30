#!/bin/bash

# Unified Pipeline Script
# This script runs the complete pipeline from start to finish:
# 1. Pipeline execution (scraping and idea generation)
# 2. Response extraction
# 3. Response merging
# 4. Supabase database insertion

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Python script exists
script_exists() {
    [ -f "$1" ]
}

# Function to check if shell script exists
shell_script_exists() {
    [ -f "$1" ] && [ -x "$1" ]
}

# Main pipeline function
run_pipeline() {
    log "🚀 Starting Unified Pipeline Execution"
    echo "=================================================================="
    
    # Step 1: Run pipeline execution (scraping and idea generation)
    log "Step 1/4: Running pipeline execution (scraping and idea generation)..."
    if shell_script_exists "pipeline_execution.sh"; then
        log "Executing: ./pipeline_execution.sh"
        if ./pipeline_execution.sh; then
            success "Pipeline execution completed successfully"
        else
            error "Pipeline execution failed"
            return 1
        fi
    else
        error "pipeline_execution.sh not found or not executable"
        return 1
    fi
    
    echo ""
    
    # Step 2: Extract responses from pipeline output
    log "Step 2/4: Extracting responses from pipeline output..."
    if script_exists "extract_responses.py"; then
        log "Executing: python3 extract_responses.py"
        if python3 extract_responses.py; then
            success "Response extraction completed successfully"
        else
            error "Response extraction failed"
            return 1
        fi
    else
        error "extract_responses.py not found"
        return 1
    fi
    
    echo ""
    
    # Step 3: Merge responses into unified format
    log "Step 3/4: Merging responses into unified format..."
    if script_exists "merge_responses.py"; then
        log "Executing: python3 merge_responses.py"
        if python3 merge_responses.py; then
            success "Response merging completed successfully"
        else
            error "Response merging failed"
            return 1
        fi
    else
        error "merge_responses.py not found"
        return 1
    fi
    
    echo ""
    
    # Step 4: Save merged ideas to Supabase
    log "Step 4/4: Saving merged ideas to Supabase..."
    if script_exists "supabase_pipeline.py"; then
        log "Executing: python3 supabase_pipeline.py"
        if python3 supabase_pipeline.py; then
            success "Supabase insertion completed successfully"
        else
            error "Supabase insertion failed"
            return 1
        fi
    else
        error "supabase_pipeline.py not found"
        return 1
    fi
    
    echo ""
    log "🎉 All pipeline steps completed successfully!"
}

# Pre-flight checks
preflight_checks() {
    log "🔍 Running pre-flight checks..."
    
    # Check if we're in the right directory
    if [ ! -f "pipeline_execution.sh" ] || [ ! -f "extract_responses.py" ] || [ ! -f "merge_responses.py" ] || [ ! -f "supabase_pipeline.py" ]; then
        error "Not all required scripts found in current directory"
        error "Please run this script from the apps/ directory"
        return 1
    fi
    
    # Check if Python 3 is available
    if ! command_exists "python3"; then
        error "Python 3 is not installed or not in PATH"
        return 1
    fi
    
    # Check if required Python packages are available
    log "Checking Python dependencies..."
    if ! python3 -c "import requests" 2>/dev/null; then
        warning "requests module not found. Installing..."
        pip3 install requests
    fi
    
    if ! python3 -c "import json" 2>/dev/null; then
        error "json module not available (this should be built-in)"
        return 1
    fi
    
    success "Pre-flight checks passed"
    return 0
}

# Cleanup function
cleanup() {
    log "🧹 Cleaning up temporary files..."
    
    # Remove temporary files that are no longer needed
    local files_to_remove=(
        "extracted_blocks.txt"
        "extracted_responses.txt"
        "pipeline_response.txt"
        "idea_detailing_agent_response.json"
        "scrape_agents_ideas.json"
    )
    
    for file in "${files_to_remove[@]}"; do
        if [ -f "$file" ]; then
            log "Removing: $file"
            rm "$file"
        fi
    done
    
    # Remove unnecessary shell scripts
    local scripts_to_remove=(
        "merge_responses.sh"
        "run_pipeline_workflow.sh"
        "run_complete_pipeline.sh"
    )
    
    for script in "${scripts_to_remove[@]}"; do
        if [ -f "$script" ]; then
            log "Removing: $script"
            rm "$script"
        fi
    done
    
    # Remove unnecessary Python scripts
    local py_scripts_to_remove=(
        "complete_pipeline_execution.py"
        "extract_pipeline_responses.py"
        "test_complete_pipeline.py"
    )
    
    for script in "${py_scripts_to_remove[@]}"; do
        if [ -f "$script" ]; then
            log "Removing: $script"
            rm "$script"
        fi
    done
    
    # Remove unnecessary markdown files
    local md_files_to_remove=(
        "COMPLETE_PIPELINE_SUMMARY.md"
        "README_complete_pipeline.md"
    )
    
    for file in "${md_files_to_remove[@]}"; do
        if [ -f "$file" ]; then
            log "Removing: $file"
            rm "$file"
        fi
    done
    
    success "Cleanup completed"
}

# Main execution
main() {
    echo "=================================================================="
    echo "🚀 UNIFIED PIPELINE SCRIPT"
    echo "=================================================================="
    echo "This script will run the complete pipeline workflow:"
    echo "1. Pipeline execution (scraping and idea generation)"
    echo "2. Response extraction"
    echo "3. Response merging"
    echo "4. Supabase database insertion"
    echo "=================================================================="
    echo ""
    
    # Run pre-flight checks
    if ! preflight_checks; then
        error "Pre-flight checks failed. Exiting."
        exit 1
    fi
    
    echo ""
    
    # Ask for confirmation
    read -p "Do you want to proceed with the pipeline execution? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Pipeline execution cancelled by user"
        exit 0
    fi
    
    echo ""
    
    # Run the pipeline
    if run_pipeline; then
        echo ""
        echo "=================================================================="
        success "🎉 PIPELINE EXECUTION COMPLETED SUCCESSFULLY!"
        echo "=================================================================="
        
        # Ask if user wants to clean up
        echo ""
        read -p "Do you want to clean up temporary files? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cleanup
        fi
        
        log "Pipeline completed. Check merged_ideas.json for results."
    else
        error "Pipeline execution failed"
        exit 1
    fi
}

# Run main function
main "$@"
