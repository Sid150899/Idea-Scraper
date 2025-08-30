# Research Agent Pipeline

This directory contains the unified pipeline for scraping, analyzing, and storing startup ideas.

## Quick Start

To run the complete pipeline:

```bash
./run_unified_pipeline.sh
```

## Pipeline Workflow

The unified pipeline script (`run_unified_pipeline.sh`) orchestrates the entire workflow:

1. **Pipeline Execution** (`pipeline_execution.sh`)
   - Runs the scraping and idea generation pipeline
   - Generates raw pipeline output

2. **Response Extraction** (`extract_responses.py`)
   - Extracts structured data from pipeline output
   - Creates separate JSON files for different agent responses

3. **Response Merging** (`merge_responses.py`)
   - Merges scrape agent and idea detailing agent responses
   - Uses sequential matching with content similarity verification
   - Outputs unified `merged_ideas.json`

4. **Database Insertion** (`supabase_pipeline.py`)
   - Saves merged ideas to Supabase database
   - Includes duplicate detection to prevent re-insertion
   - Handles all database operations

## Files

### Core Scripts
- `run_unified_pipeline.sh` - **Main entry point** - runs the complete pipeline
- `pipeline_execution.sh` - Step 1: Pipeline execution
- `extract_responses.py` - Step 2: Response extraction
- `merge_responses.py` - Step 3: Response merging
- `supabase_pipeline.py` - Step 4: Database insertion

### Output Files
- `merged_ideas.json` - Final merged and processed ideas

### Configuration
- `README.md` - This documentation file

## Features

- **Unified Workflow**: Single command runs the entire pipeline
- **Error Handling**: Comprehensive error checking and logging
- **Duplicate Prevention**: Automatically detects and skips duplicate ideas
- **Content Verification**: Uses content similarity to verify idea matches
- **Clean Output**: Only keeps essential files, removes temporary data
- **User Confirmation**: Asks for confirmation before execution and cleanup

## Requirements

- Python 3.x
- `requests` module
- Supabase configuration in `../config.py`
- Executable permissions on shell scripts

## Usage Examples

### Run Complete Pipeline
```bash
./run_unified_pipeline.sh
```

### Run Individual Steps
```bash
# Step 1: Pipeline execution
./pipeline_execution.sh

# Step 2: Extract responses
python3 extract_responses.py

# Step 3: Merge responses
python3 merge_responses.py

# Step 4: Save to database
python3 supabase_pipeline.py
```

## Output

The pipeline produces:
- **Scraped startup ideas** with URLs and content
- **AI-generated analysis** including implementation plans and market analysis
- **Evaluation scores** for innovation, quality, and problem significance
- **Database storage** in Supabase with duplicate prevention

## Error Handling

The pipeline includes:
- Pre-flight dependency checks
- Step-by-step error detection
- Graceful failure handling
- Detailed logging and status reporting
