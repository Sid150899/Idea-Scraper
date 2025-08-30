# IDEAS - Intelligent Data Extraction and Analysis System

An agentic workflow to scrape startup ideas from different Reddit sources and provide intelligent scoring based on quality, innovation, and engagement metrics.

## 🚀 Overview

IDEAS is a comprehensive system that combines:
- **AI-Powered Scraping Agents** that extract startup ideas from Reddit subreddits
- **Intelligent Analysis** that evaluates ideas using multiple criteria
- **Modern React Frontend** for browsing and saving ideas
- **Supabase Backend** for data storage and user management

## ✨ Features

### Backend Capabilities
- **Multi-Source Scraping**: Automatically scrapes from r/SaaS, r/Businessideas, r/cofounder, r/SideProject, r/startupideas
- **AI-Powered Analysis**: Uses Gemini AI to evaluate ideas across multiple dimensions
- **Intelligent Scoring**: Provides scores for Innovation, Quality, Problem Significance, and Engagement
- **Data Pipeline**: Automated workflow from scraping to database storage

### Frontend Features
- **User Authentication**: Secure login/register system with Supabase
- **Idea Browsing**: Clean, minimalist interface for exploring startup ideas
- **Advanced Search**: Find ideas by title, content, or source subreddit
- **Save System**: Bookmark interesting ideas for later reference
- **Detailed Views**: Comprehensive analysis with evaluation explanations
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🏗️ Architecture

```
IDEAS Application
├── Backend (Python)
│   ├── Scraping Agents
│   │   ├── Business Ideas Agent
│   │   ├── SaaS Agent
│   │   ├── Cofounder Agent
│   │   ├── Side Project Agent
│   │   └── Startup Ideas Agent
│   ├── Analysis Agents
│   │   └── Idea Detailing Agent
│   ├── Data Pipeline
│   │   ├── Response Extraction
│   │   ├── Data Merging
│   │   └── Supabase Integration
│   └── Configuration
│       ├── Environment Management
│       └── Database Services
├── Frontend (React + TypeScript)
│   ├── Authentication System
│   ├── Idea Browsing Interface
│   ├── Detail Views
│   ├── Save Functionality
│   └── Search & Filtering
└── Database (Supabase)
    ├── User Management
    ├── Idea Storage
    └── Saved Ideas Tracking
```

## 🛠️ Technology Stack

### Backend
- **Python 3.8+**
- **Google Gemini AI** for idea analysis
- **Supabase** for database and authentication
- **Agentic Development Kit (ADK)** for workflow orchestration

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Supabase Client** for database operations
- **CSS3** with responsive design

### Database
- **Supabase PostgreSQL** for data storage
- **Row Level Security (RLS)** for data protection
- **Real-time subscriptions** for live updates

## 📋 Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- Supabase account and project
- Google Gemini API key
- Reddit API access (optional, for enhanced scraping)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Sid150899/Idea-Scraper.git
cd Idea-Scraper
```

### 2. Backend Setup
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp agents/.env.example agents/.env
# Edit agents/.env with your API keys
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm start
```

### 4. Database Setup
1. Create a Supabase project
2. Set up the required tables (see Database Schema section)
3. Configure Row Level Security policies
4. Update environment variables with your Supabase credentials

## 🔧 Configuration

### Environment Variables

#### Backend (.env in agents/ directory)
```bash
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_gemini_key
CRAWL4AI_API_KEY=your_crawl4ai_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
```

#### Frontend (.env in frontend/ directory)
```bash
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 Database Schema

### Tables

#### `scraped_idea`
Stores all scraped startup ideas with analysis results:
- `idea_id` (Primary Key)
- `title`, `url`, `content`
- `evaluation_score`, `innovation`, `quality`, `problem_significance`, `engagement_score`
- `introduction`, `implementation_plan`, `market_analysis`
- `source_subreddit`, `date_of_post`
- `created_at`, `updated_at`

#### `User`
User authentication and profile data:
- `user_id` (Primary Key)
- `first_name`, `last_name`, `email`
- `password_hash`, `is_paid`
- `created_at`, `updated_at`

#### `saved_ideas`
Junction table for user-saved ideas:
- `user_id` (Foreign Key to User)
- `idea_id` (Foreign Key to scraped_idea)

## 🔄 Usage Workflow

### 1. Data Collection
```bash
# Run the complete pipeline
cd data/outputs
python3 supabase_pipeline.py
```

### 2. Data Analysis
The system automatically:
- Scrapes ideas from multiple Reddit sources
- Analyzes each idea using AI agents
- Calculates evaluation scores
- Stores results in Supabase

### 3. Frontend Access
- Users can browse all ideas
- Search and filter by various criteria
- Save interesting ideas
- View detailed analysis and scores

## 🚀 Deployment

### Backend Deployment
The backend runs locally and can be scheduled using cron jobs or GitHub Actions to regularly update the database.

### Frontend Deployment
```bash
cd frontend
npm run build

# Deploy to your preferred platform:
# - Vercel: vercel --prod
# - Netlify: netlify deploy --prod --dir=build
# - GitHub Pages: npm run deploy
# - AWS S3: Upload build/ folder
```

## 📈 Evaluation Metrics

### Scoring System
- **Innovation (1-10)**: Uniqueness and novelty of the idea
- **Quality (1-10)**: Technical feasibility and business model clarity
- **Problem Significance (1-10)**: Impact and urgency of the problem solved
- **Engagement (0-100)**: Community interest and discussion level

### Analysis Categories
- **Introduction**: Summary of the idea and problem it solves
- **Implementation Plan**: Key steps and resources needed
- **Market Analysis**: Target users, market size, expected revenue
- **User Comments**: Summary of Reddit feedback and sentiment
- **Advice for Improvement**: Concrete suggestions for enhancement

## 🔒 Security Features

- **Row Level Security (RLS)** in Supabase
- **Environment variable protection** for API keys
- **User authentication** with secure password handling
- **CORS protection** for API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report bugs and feature requests via GitHub Issues
- **Documentation**: Check the `docs/` folder for detailed guides
- **Wiki**: Project wiki for community-contributed content

## 🙏 Acknowledgments

- **Google Gemini AI** for intelligent idea analysis
- **Supabase** for backend-as-a-service infrastructure
- **Reddit** for providing the source data
- **Open Source Community** for various tools and libraries

## 📊 Project Status

- ✅ **Backend Agents**: Complete and functional
- ✅ **Data Pipeline**: Automated and tested
- ✅ **Frontend Application**: Production-ready
- ✅ **Database Integration**: Fully implemented
- 🔄 **Continuous Improvement**: Ongoing development

---

**Built with ❤️ for the startup community**

*Last updated: January 2025*
