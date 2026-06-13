-- =============================================================================
-- DIARY DUMP - SECURE DATABASE SETUP
-- 
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLE: profiles (extends auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT DEFAULT '',
  recovery_pin TEXT NOT NULL DEFAULT '0000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: Everyone can read usernames/avatars, only owner can update
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" 
  ON profiles FOR DELETE USING (auth.uid() = id);

-- =============================================================================
-- TABLE: diaries
-- =============================================================================
CREATE TABLE IF NOT EXISTS diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'Heavy',
  color TEXT DEFAULT '#ffffff',
  font TEXT DEFAULT 'Caveat',
  rotation FLOAT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  is_private BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  repost_of UUID REFERENCES diaries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;

-- Diaries: Public diaries viewable by all, private only by owner
CREATE POLICY "Public diaries are viewable by everyone" 
  ON diaries FOR SELECT USING (is_private = false OR auth.uid() = author_id);

CREATE POLICY "Users can create own diaries" 
  ON diaries FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own diaries" 
  ON diaries FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own diaries" 
  ON diaries FOR DELETE USING (auth.uid() = author_id);

-- =============================================================================
-- TABLE: repost_chain
-- =============================================================================
CREATE TABLE IF NOT EXISTS repost_chain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID REFERENCES diaries(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  color TEXT DEFAULT '#ffffff',
  font TEXT DEFAULT 'Caveat',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE repost_chain ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Repost chains viewable with diary" 
  ON repost_chain FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM diaries WHERE diaries.id = repost_chain.diary_id 
      AND (diaries.is_private = false OR diaries.author_id = auth.uid())
    )
  );

CREATE POLICY "Users can create repost chain entries" 
  ON repost_chain FOR INSERT WITH CHECK (auth.uid() = author_id);

-- =============================================================================
-- TABLE: comments
-- =============================================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID REFERENCES diaries(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable with diary" 
  ON comments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM diaries WHERE diaries.id = comments.diary_id 
      AND (diaries.is_private = false OR diaries.author_id = auth.uid())
    )
  );

CREATE POLICY "Users can create comments" 
  ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments or comments on own diaries" 
  ON comments FOR DELETE USING (
    auth.uid() = author_id OR 
    auth.uid() IN (SELECT author_id FROM diaries WHERE id = comments.diary_id)
  );

-- =============================================================================
-- TABLE: bookmarks
-- =============================================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  diary_id UUID REFERENCES diaries(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, diary_id)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks" 
  ON bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks" 
  ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" 
  ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- TABLE: notifications
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  from_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  diary_id UUID REFERENCES diaries(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" 
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" 
  ON notifications FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- TABLE: blocked_users
-- =============================================================================
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocked list" 
  ON blocked_users FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can block users" 
  ON blocked_users FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unblock users" 
  ON blocked_users FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- TABLE: notification_settings
-- =============================================================================
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  replies BOOLEAN DEFAULT true,
  comment_replies BOOLEAN DEFAULT true,
  bookmarks BOOLEAN DEFAULT true,
  views BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" 
  ON notification_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
  ON notification_settings FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, recovery_pin)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'recovery_pin', '0000')
  );

  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Increment views function (batch updates)
CREATE OR REPLACE FUNCTION public.increment_views(diary_ids UUID[])
RETURNS VOID AS $$
BEGIN
  UPDATE diaries SET views = views + 1 WHERE id = ANY(diary_ids);
END;
$$ LANGUAGE plpgsql;

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_diaries_updated_at ON diaries;
CREATE TRIGGER update_diaries_updated_at
  BEFORE UPDATE ON diaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STORAGE BUCKET: avatars
-- =============================================================================
-- Run this in Supabase Storage UI or use Supabase CLI:
-- supabase storage create bucket avatars --public
-- 
-- Then set bucket policy:
-- CREATE POLICY "Avatar uploads" ON storage.objects FOR INSERT 
--   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Avatar reads" ON storage.objects FOR SELECT 
--   USING (bucket_id = 'avatars');
-- =============================================================================
