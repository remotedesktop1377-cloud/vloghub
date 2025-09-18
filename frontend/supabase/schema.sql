-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    -- Optional public profile fields
    username TEXT,
    phone TEXT,
    bio TEXT,
    location TEXT,
    website_url TEXT,
    -- Social auth keys (per-user secrets for posting/sharing)
    tiktok_key TEXT,
    instagram_key TEXT,
    facebook_key TEXT,
    youtube_key TEXT,
    -- Optional social handles/identifiers
    tiktok_handle TEXT,
    instagram_handle TEXT,
    facebook_page TEXT,
    youtube_channel TEXT,
    -- JSON preferences blob (notifications, theme, etc.)
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns exist even if table was created earlier without them
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS website_url TEXT,
    ADD COLUMN IF NOT EXISTS tiktok_key TEXT,
    ADD COLUMN IF NOT EXISTS instagram_key TEXT,
    ADD COLUMN IF NOT EXISTS facebook_key TEXT,
    ADD COLUMN IF NOT EXISTS youtube_key TEXT,
    ADD COLUMN IF NOT EXISTS tiktok_handle TEXT,
    ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
    ADD COLUMN IF NOT EXISTS facebook_page TEXT,
    ADD COLUMN IF NOT EXISTS youtube_channel TEXT,
    ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Create youtube_videos table
CREATE TABLE IF NOT EXISTS public.youtube_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    duration INTEGER,
    published_at TIMESTAMP WITH TIME ZONE,
    channel_title TEXT,
    view_count BIGINT,
    like_count BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- Create video_clips table
CREATE TABLE IF NOT EXISTS public.video_clips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID REFERENCES public.youtube_videos(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    transcript TEXT,
    keywords TEXT[],
    sentiment_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search_history table
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    query TEXT NOT NULL,
    filters JSONB,
    results_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trending_topics table
CREATE TABLE IF NOT EXISTS public.trending_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT,
    search_volume INTEGER,
    date_range TEXT NOT NULL,
    related_keywords TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(topic, category, date_range, location)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_topics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- YouTube videos policies
CREATE POLICY "Users can view own videos" ON public.youtube_videos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own videos" ON public.youtube_videos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos" ON public.youtube_videos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos" ON public.youtube_videos
    FOR DELETE USING (auth.uid() = user_id);

-- Video clips policies
CREATE POLICY "Users can view own clips" ON public.video_clips
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clips" ON public.video_clips
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clips" ON public.video_clips
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clips" ON public.video_clips
    FOR DELETE USING (auth.uid() = user_id);

-- Search history policies
CREATE POLICY "Users can view own search history" ON public.search_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history" ON public.search_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trending topics policies (public read access)
CREATE POLICY "Anyone can view trending topics" ON public.trending_topics
    FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Authenticated users can insert trending topics" ON public.trending_topics
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update trending topics" ON public.trending_topics
    FOR UPDATE TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_user_id ON public.youtube_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_video_id ON public.youtube_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_video_clips_user_id ON public.video_clips(user_id);
CREATE INDEX IF NOT EXISTS idx_video_clips_video_id ON public.video_clips(video_id);
CREATE INDEX IF NOT EXISTS idx_video_clips_keywords ON public.video_clips USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trending_topics_category ON public.trending_topics(category);
CREATE INDEX IF NOT EXISTS idx_trending_topics_location ON public.trending_topics(location);
CREATE INDEX IF NOT EXISTS idx_trending_topics_date_range ON public.trending_topics(date_range);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_youtube_videos_updated_at 
    BEFORE UPDATE ON public.youtube_videos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_clips_updated_at 
    BEFORE UPDATE ON public.video_clips 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trending_topics_updated_at 
    BEFORE UPDATE ON public.trending_topics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
