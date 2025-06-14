/*
  # Sessions and Reflections Schema

  1. New Tables
    - `life_sessions`
      - Focus sessions, planning sessions, reflection sessions
      - Track duration, mood, energy, and productivity
    
    - `daily_reflections`
      - Daily reflection entries with structured questions
      - Mood, energy, wins, challenges, and lessons
    
    - `weekly_reflections`
      - Weekly review and planning sessions
      - Goal progress, habit analysis, and insights
    
    - `session_tags`
      - Tagging system for sessions and reflections

  2. Security
    - Enable RLS on all tables
    - Users can only access their own sessions and reflections
*/

-- Session Tags Table
CREATE TABLE IF NOT EXISTS session_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6B7280',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Life Sessions Table
CREATE TABLE IF NOT EXISTS life_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('focus', 'reflection', 'planning', 'review', 'meditation', 'learning', 'creative')),
  title text NOT NULL,
  description text,
  planned_duration integer, -- in minutes
  actual_duration integer, -- in minutes
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  mood_before integer CHECK (mood_before >= 1 AND mood_before <= 10),
  mood_after integer CHECK (mood_after >= 1 AND mood_after <= 10),
  energy_before integer CHECK (energy_before >= 1 AND energy_before <= 10),
  energy_after integer CHECK (energy_after >= 1 AND energy_after <= 10),
  focus_level integer CHECK (focus_level >= 1 AND focus_level <= 10),
  productivity_rating integer CHECK (productivity_rating >= 1 AND productivity_rating <= 10),
  satisfaction_rating integer CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 10),
  notes text,
  outcomes text,
  interruptions integer DEFAULT 0,
  environment_rating integer CHECK (environment_rating >= 1 AND environment_rating <= 10),
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Daily Reflections Table
CREATE TABLE IF NOT EXISTS daily_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  reflection_date date NOT NULL,
  overall_mood integer CHECK (overall_mood >= 1 AND overall_mood <= 10),
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 10),
  stress_level integer CHECK (stress_level >= 1 AND stress_level <= 10),
  productivity_score integer CHECK (productivity_score >= 1 AND productivity_score <= 10),
  gratitude_items text[] DEFAULT '{}',
  wins text[] DEFAULT '{}',
  challenges text[] DEFAULT '{}',
  lessons_learned text[] DEFAULT '{}',
  tomorrow_priorities text[] DEFAULT '{}',
  habits_completed text[] DEFAULT '{}',
  goals_progressed text[] DEFAULT '{}',
  reflection_notes text,
  improvement_areas text,
  celebration_notes text,
  sleep_quality integer CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  sleep_hours numeric(3,1),
  exercise_completed boolean DEFAULT false,
  exercise_type text,
  exercise_duration integer, -- in minutes
  social_interactions integer DEFAULT 0,
  screen_time_hours numeric(3,1),
  learning_time_minutes integer DEFAULT 0,
  creative_time_minutes integer DEFAULT 0,
  meditation_minutes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, reflection_date)
);

-- Weekly Reflections Table
CREATE TABLE IF NOT EXISTS weekly_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  overall_satisfaction integer CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 10),
  goal_progress_rating integer CHECK (goal_progress_rating >= 1 AND goal_progress_rating <= 10),
  habit_consistency_rating integer CHECK (habit_consistency_rating >= 1 AND habit_consistency_rating <= 10),
  work_life_balance_rating integer CHECK (work_life_balance_rating >= 1 AND work_life_balance_rating <= 10),
  biggest_wins text[] DEFAULT '{}',
  main_challenges text[] DEFAULT '{}',
  key_learnings text[] DEFAULT '{}',
  goals_achieved text[] DEFAULT '{}',
  goals_behind text[] DEFAULT '{}',
  habits_strong text[] DEFAULT '{}',
  habits_weak text[] DEFAULT '{}',
  next_week_priorities text[] DEFAULT '{}',
  next_week_focus_areas text[] DEFAULT '{}',
  improvements_to_make text[] DEFAULT '{}',
  things_to_stop text[] DEFAULT '{}',
  things_to_start text[] DEFAULT '{}',
  things_to_continue text[] DEFAULT '{}',
  reflection_notes text,
  energy_patterns text,
  productivity_patterns text,
  mood_patterns text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- Monthly Reviews Table
CREATE TABLE IF NOT EXISTS monthly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  month_year text NOT NULL, -- Format: YYYY-MM
  overall_progress_rating integer CHECK (overall_progress_rating >= 1 AND overall_progress_rating <= 10),
  life_satisfaction_rating integer CHECK (life_satisfaction_rating >= 1 AND life_satisfaction_rating <= 10),
  major_achievements text[] DEFAULT '{}',
  significant_challenges text[] DEFAULT '{}',
  key_insights text[] DEFAULT '{}',
  goals_completed integer DEFAULT 0,
  goals_in_progress integer DEFAULT 0,
  habits_established text[] DEFAULT '{}',
  habits_dropped text[] DEFAULT '{}',
  skills_developed text[] DEFAULT '{}',
  relationships_improved text[] DEFAULT '{}',
  health_improvements text[] DEFAULT '{}',
  financial_progress text,
  next_month_goals text[] DEFAULT '{}',
  areas_for_improvement text[] DEFAULT '{}',
  systems_to_optimize text[] DEFAULT '{}',
  reflection_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Enable Row Level Security
ALTER TABLE session_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for session_tags
CREATE POLICY "Users can manage own session tags"
  ON session_tags
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for life_sessions
CREATE POLICY "Users can manage own life sessions"
  ON life_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for daily_reflections
CREATE POLICY "Users can manage own daily reflections"
  ON daily_reflections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for weekly_reflections
CREATE POLICY "Users can manage own weekly reflections"
  ON weekly_reflections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for monthly_reviews
CREATE POLICY "Users can manage own monthly reviews"
  ON monthly_reviews
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to auto-complete sessions
CREATE OR REPLACE FUNCTION auto_complete_session()
RETURNS trigger AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
    NEW.is_completed = true;
    NEW.actual_duration = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for session completion
CREATE TRIGGER auto_complete_session_trigger
  BEFORE UPDATE ON life_sessions
  FOR EACH ROW EXECUTE FUNCTION auto_complete_session();

-- Triggers for updated_at
CREATE TRIGGER update_life_sessions_updated_at
  BEFORE UPDATE ON life_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_reflections_updated_at
  BEFORE UPDATE ON daily_reflections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_reflections_updated_at
  BEFORE UPDATE ON weekly_reflections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_reviews_updated_at
  BEFORE UPDATE ON monthly_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();