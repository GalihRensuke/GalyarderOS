/*
  # Habit Tracking System

  1. New Tables
    - `habit_categories` - Categories for organizing habits
    - `habits` - Main habits table with tracking configuration
    - `habit_completions` - Daily completion records
    - `habit_streaks` - Streak history tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - System categories accessible to all users

  3. Functions
    - Automatic streak calculation
    - Statistics updates on completion
*/

-- Habit Categories Table
CREATE TABLE IF NOT EXISTS habit_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#10B981',
  icon text DEFAULT 'zap',
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint for habit categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'habit_categories_user_name_unique' 
    AND table_name = 'habit_categories'
  ) THEN
    ALTER TABLE habit_categories ADD CONSTRAINT habit_categories_user_name_unique UNIQUE(user_id, name);
  END IF;
END $$;

-- Habits Table
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES habit_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  frequency text DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  frequency_config jsonb DEFAULT '{"times_per_period": 1, "period": "day"}'::jsonb,
  habit_type text DEFAULT 'boolean' CHECK (habit_type IN ('boolean', 'numeric', 'duration', 'scale')),
  target_value numeric,
  unit text,
  reminder_time time,
  reminder_enabled boolean DEFAULT true,
  is_active boolean DEFAULT true,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  total_completions integer DEFAULT 0,
  success_rate numeric(5,2) DEFAULT 0,
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habit Completions Table
CREATE TABLE IF NOT EXISTS habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  completion_date date NOT NULL,
  completed boolean DEFAULT true,
  value numeric,
  duration_minutes integer,
  scale_rating integer CHECK (scale_rating >= 1 AND scale_rating <= 10),
  notes text,
  mood_before integer CHECK (mood_before >= 1 AND mood_before <= 10),
  mood_after integer CHECK (mood_after >= 1 AND mood_after <= 10),
  energy_before integer CHECK (energy_before >= 1 AND energy_before <= 10),
  energy_after integer CHECK (energy_after >= 1 AND energy_after <= 10),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint for habit completions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'habit_completions_habit_date_unique' 
    AND table_name = 'habit_completions'
  ) THEN
    ALTER TABLE habit_completions ADD CONSTRAINT habit_completions_habit_date_unique UNIQUE(habit_id, completion_date);
  END IF;
END $$;

-- Habit Streaks History Table
CREATE TABLE IF NOT EXISTS habit_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL,
  end_date date,
  streak_length integer NOT NULL,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE habit_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_streaks ENABLE ROW LEVEL SECURITY;

-- Policies for habit_categories
DROP POLICY IF EXISTS "Users can manage own habit categories" ON habit_categories;
CREATE POLICY "Users can manage own habit categories"
  ON habit_categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR is_system = true)
  WITH CHECK (auth.uid() = user_id);

-- Policies for habits
DROP POLICY IF EXISTS "Users can manage own habits" ON habits;
CREATE POLICY "Users can manage own habits"
  ON habits
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for habit_completions
DROP POLICY IF EXISTS "Users can manage own habit completions" ON habit_completions;
CREATE POLICY "Users can manage own habit completions"
  ON habit_completions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM habits 
      WHERE habits.id = habit_completions.habit_id 
      AND habits.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM habits 
      WHERE habits.id = habit_completions.habit_id 
      AND habits.user_id = auth.uid()
    )
  );

-- Policies for habit_streaks
DROP POLICY IF EXISTS "Users can view own habit streaks" ON habit_streaks;
CREATE POLICY "Users can view own habit streaks"
  ON habit_streaks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM habits 
      WHERE habits.id = habit_streaks.habit_id 
      AND habits.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can manage habit streaks" ON habit_streaks;
CREATE POLICY "System can manage habit streaks"
  ON habit_streaks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM habits 
      WHERE habits.id = habit_streaks.habit_id 
      AND habits.user_id = auth.uid()
    )
  );

-- Function to update habit streaks
CREATE OR REPLACE FUNCTION update_habit_streaks()
RETURNS trigger AS $$
DECLARE
  current_streak_count integer := 0;
  last_completion_date date;
  streak_broken boolean := false;
BEGIN
  -- Calculate current streak
  SELECT completion_date INTO last_completion_date
  FROM habit_completions 
  WHERE habit_id = NEW.habit_id 
    AND completed = true 
    AND completion_date <= NEW.completion_date
  ORDER BY completion_date DESC 
  LIMIT 1 OFFSET 1;

  -- Count consecutive days from the completion date backwards
  WITH consecutive_days AS (
    SELECT completion_date,
           completion_date - ROW_NUMBER() OVER (ORDER BY completion_date DESC) * INTERVAL '1 day' as group_date
    FROM habit_completions
    WHERE habit_id = NEW.habit_id 
      AND completed = true 
      AND completion_date <= NEW.completion_date
    ORDER BY completion_date DESC
  ),
  streak_groups AS (
    SELECT completion_date, group_date,
           ROW_NUMBER() OVER (ORDER BY completion_date DESC) as streak_length
    FROM consecutive_days
    WHERE group_date = (
      SELECT group_date 
      FROM consecutive_days 
      WHERE completion_date = NEW.completion_date
    )
  )
  SELECT COALESCE(MAX(streak_length), 0) INTO current_streak_count
  FROM streak_groups;

  -- Update habit statistics
  UPDATE habits 
  SET 
    current_streak = current_streak_count,
    longest_streak = GREATEST(longest_streak, current_streak_count),
    total_completions = (
      SELECT COUNT(*) 
      FROM habit_completions 
      WHERE habit_id = NEW.habit_id AND completed = true
    ),
    success_rate = (
      SELECT 
        CASE 
          WHEN COUNT(*) = 0 THEN 0
          ELSE (COUNT(*) FILTER (WHERE completed = true) * 100.0 / COUNT(*))
        END
      FROM habit_completions 
      WHERE habit_id = NEW.habit_id
    ),
    updated_at = now()
  WHERE id = NEW.habit_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for habit completion updates
DROP TRIGGER IF EXISTS update_habit_streaks_trigger ON habit_completions;
CREATE TRIGGER update_habit_streaks_trigger
  AFTER INSERT OR UPDATE ON habit_completions
  FOR EACH ROW EXECUTE FUNCTION update_habit_streaks();

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_habit_categories_updated_at ON habit_categories;
CREATE TRIGGER update_habit_categories_updated_at
  BEFORE UPDATE ON habit_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_habits_updated_at ON habits;
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_habit_completions_updated_at ON habit_completions;
CREATE TRIGGER update_habit_completions_updated_at
  BEFORE UPDATE ON habit_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default habit categories (only if they don't exist)
DO $$
BEGIN
  -- Check if system categories already exist
  IF NOT EXISTS (SELECT 1 FROM habit_categories WHERE is_system = true LIMIT 1) THEN
    INSERT INTO habit_categories (name, description, color, icon, is_system) VALUES
    ('Health', 'Physical wellness and fitness habits', '#EF4444', 'heart', true),
    ('Mental', 'Cognitive and mental health practices', '#8B5CF6', 'brain', true),
    ('Productivity', 'Work and efficiency habits', '#3B82F6', 'zap', true),
    ('Learning', 'Education and skill development', '#F59E0B', 'book', true),
    ('Social', 'Relationship and communication habits', '#EC4899', 'users', true),
    ('Spiritual', 'Mindfulness and spiritual practices', '#6366F1', 'compass', true),
    ('Creative', 'Artistic and creative habits', '#F97316', 'palette', true),
    ('Financial', 'Money management habits', '#10B981', 'dollar-sign', true);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_category_id ON habits(category_id);
CREATE INDEX IF NOT EXISTS idx_habits_is_active ON habits(is_active);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_habit_streaks_habit_id ON habit_streaks(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_categories_user_id ON habit_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_categories_is_system ON habit_categories(is_system);