# IDEAS Frontend

A React-based frontend for the IDEAS application that displays startup ideas scraped from Reddit.

## Features

- **Authentication**: Login/Register system with Supabase
- **Home Page**: Display all ideas in card format with search and filter
- **Idea Details**: Detailed view of each idea with evaluation scores
- **Save Functionality**: Users can save/unsave ideas
- **Responsive Design**: Works on desktop and mobile devices

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the frontend directory with:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url_here
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **Get Supabase Credentials**:
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the Project URL and anon/public key
   - Paste them in your `.env` file

4. **Start Development Server**:
   ```bash
   npm start
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

## Database Schema

The frontend expects the following tables in your Supabase database:

- `User`: User authentication and profile data
- `scraped_idea`: Startup ideas with evaluation scores
- `saved_ideas`: Junction table for user-saved ideas

## Deployment

The app can be deployed to any static hosting service:

- **Vercel**: Connect your GitHub repo and deploy automatically
- **Netlify**: Drag and drop the `build` folder
- **GitHub Pages**: Use `npm run deploy`
- **AWS S3**: Upload the `build` folder to an S3 bucket

## Backend Integration

This frontend works with your existing backend pipeline:
1. Run your scraping pipeline to update the Supabase database
2. The frontend automatically reflects the new data
3. No frontend redeployment needed for data updates
