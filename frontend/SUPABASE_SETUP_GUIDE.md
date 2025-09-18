# Supabase Integration Setup Guide

## Prerequisites
- Supabase project created on [supabase.com](https://supabase.com)
- Project credentials (URL and API keys)

## Step 1: Environment Variables Setup

Create a `.env.local` file in your `frontend` directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### How to get your Supabase credentials:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Step 2: Database Schema Setup

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase/schema.sql`
5. Run the query to create all tables, policies, and triggers

## Step 3: Authentication Configuration

1. In your Supabase Dashboard, go to **Authentication** → **Settings**
2. Configure the following:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback` (for development)
   - For production, update these URLs accordingly

3. Enable the authentication providers:
   - **Email/Password**: Enabled by default
   - **Google OAuth**: Follow these steps:
     a. Go to **Authentication** → **Providers** → **Google**
     b. Enable Google provider
     c. Add your Google OAuth credentials:
        - **Client ID**: From Google Cloud Console
        - **Client Secret**: From Google Cloud Console
     d. Set **Redirect URL**: `https://your-project-id.supabase.co/auth/v1/callback`

### Setting up Google OAuth:

1. **Google Cloud Console Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
   - Set **Application type** to "Web application"
   - Add **Authorized redirect URIs**:
     - `https://your-project-id.supabase.co/auth/v1/callback`
   - Copy **Client ID** and **Client Secret**

2. **Supabase Configuration**:
   - Paste the credentials in Supabase → Authentication → Providers → Google
   - Save the configuration

## Step 4: Row Level Security (RLS)

The schema automatically sets up Row Level Security policies that ensure:
- Users can only access their own data
- Trending topics are publicly readable
- Proper authentication is required for all operations

## Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. The application now includes:
   - **Authentication Context**: Available throughout the app
   - **Auth Modal**: Sign in/up functionality
   - **User Profile**: Profile management
   - **Database Helpers**: Functions to interact with Supabase
   - **Toast Notifications**: User feedback for all operations

## Available Components

### Authentication
- `AuthProvider`: Context provider for authentication state
- `AuthModal`: Modal for sign in/up/password reset
- `UserProfile`: User profile management component

### Database Helpers
All available in `SupabaseHelpers` class:
- `saveUserProfile()`: Save/update user profile
- `getUserProfile()`: Get user profile
- `saveYouTubeVideo()`: Save video metadata
- `saveVideoClip()`: Save video clip/segment
- `getUserVideoClips()`: Get user's clips
- `saveSearchHistory()`: Save search queries
- `getSearchHistory()`: Get search history
- `saveTrendingTopics()`: Save trending topics
- `getTrendingTopics()`: Get trending topics with filters
- `searchVideoClips()`: Search clips by keywords
- `deleteVideoClip()`: Delete a clip
- `updateVideoClip()`: Update clip information

## Usage Examples

### Using Authentication
```tsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, loading, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.email}!</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <AuthModal isOpen={true} onClose={() => {}} />
      )}
    </div>
  );
}
```

### Using Database Helpers
```tsx
import { SupabaseHelpers } from '../utils/helperFunctions';
import { useAuth } from '../context/AuthContext';

function SaveClip() {
  const { user } = useAuth();
  
  const handleSaveClip = async () => {
    if (!user) return;
    
    const clipData = {
      video_id: 'video-uuid',
      user_id: user.id,
      title: 'My Clip',
      start_time: 30,
      end_time: 90,
      transcript: 'Clip transcript...',
      keywords: ['keyword1', 'keyword2']
    };
    
    const { data, error } = await SupabaseHelpers.saveVideoClip(clipData);
    if (data) {
      console.log('Clip saved successfully!');
    }
  };
  
  return <button onClick={handleSaveClip}>Save Clip</button>;
}
```

## Security Considerations

1. **Never expose service_role key** in client-side code
2. **Row Level Security** is enabled on all tables
3. **Authentication required** for all user-specific operations
4. **Input validation** is handled by database constraints
5. **HTTPS only** for production environments

## Database Schema Overview

### Tables Created:
- `profiles`: User profile information
- `youtube_videos`: YouTube video metadata
- `video_clips`: Video clips/segments with timestamps
- `search_history`: User search queries
- `trending_topics`: Trending topics data

### Features:
- Automatic profile creation on user signup
- Timestamp tracking (created_at, updated_at)
- Full-text search capabilities
- Optimized indexes for performance
- Row Level Security for data protection

## Troubleshooting

### Common Issues:

1. **Environment variables not loading**
   - Restart your development server after adding .env.local
   - Ensure variables start with `NEXT_PUBLIC_` for client-side access

2. **Database connection errors**
   - Verify your Supabase URL and keys
   - Check if your Supabase project is active

3. **RLS policy errors**
   - Ensure user is authenticated before database operations
   - Check that policies are correctly applied in Supabase Dashboard

4. **Authentication not working**
   - Verify redirect URLs in Supabase Auth settings
   - Check browser console for detailed error messages

## Next Steps

After completing this setup:
1. Test user registration and login
2. Try saving and retrieving data
3. Customize the UI components to match your design
4. Add additional database tables as needed
5. Set up production environment variables
6. Configure custom email templates in Supabase

## Production Deployment

When deploying to production:
1. Update environment variables with production URLs
2. Configure production redirect URLs in Supabase
3. Set up custom domain if needed
4. Enable additional security features
5. Set up monitoring and logging

For more information, refer to the [Supabase Documentation](https://supabase.com/docs).
