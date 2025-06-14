/*
  # Goals and Vision Architecture Schema

  1. New Tables
    - `goals`
      - Complete goal management with categories, priorities, and progress tracking
      - Supports milestones and deadlines
    
    - `goal_milestones`
      - Individual milestones for each goal
      - Track completion status and dates
    
    - `goal_categories`
      - Predefined and custom goal categories
      - Color coding and icons

  2. Security
    - Enable RLS on all tables
    - Users can only access their own goals and milestones
*/

-- Goal Categories Table
CREATE TABLE IF NOT EXISTS goal_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'target',
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Goals Table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES goal_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived', 'cancelled')),
  progress numeric(5,2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  target_value numeric,
  current_value numeric DEFAULT 0,
  unit text,
  deadline date,
  start_date date DEFAULT CURRENT_DATE,
  completed_at timestamptz,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Goal Milestones Table
CREATE TABLE IF NOT EXISTS goal_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  target_value numeric,
  current_value numeric DEFAULT 0,
  unit text,
  due_date date,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Goal Progress History Table
CREATE TABLE IF NOT EXISTS goal_progress_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  previous_value numeric,
  new_value numeric,
  progress_delta numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE goal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress_history ENABLE ROW LEVEL SECURITY;

-- Policies for goal_categories
CREATE POLICY "Users can manage own goal categories"
  ON goal_categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR is_system = true)
  WITH CHECK (auth.uid() = user_id);

-- Policies for goals
CREATE POLICY "Users can manage own goals"
  ON goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for goal_milestones
CREATE POLICY "Users can manage own goal milestones"
  ON goal_milestones
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_milestones.goal_id 
      AND goals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_milestones.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

-- Policies for goal_progress_history
CREATE POLICY "Users can view own goal progress history"
  ON goal_progress_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_progress_history.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert goal progress history"
  ON goal_progress_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_progress_history.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

-- Function to update goal progress and create history
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS trigger AS $$
BEGIN
  -- Insert progress history if progress changed
  IF OLD.progress IS DISTINCT FROM NEW.progress THEN
    INSERT INTO goal_progress_history (goal_id, previous_value, new_value, progress_delta)
    VALUES (
      NEW.id,
      OLD.progress,
      NEW.progress,
      NEW.progress - COALESCE(OLD.progress, 0)
    );
  END IF;
  
  -- Auto-complete goal if progress reaches 100%
  IF NEW.progress >= 100 AND OLD.progress < 100 THEN
    NEW.status = 'completed';
    NEW.completed_at = now();
  END IF;
  
  -- Update timestamp
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for goal progress updates
CREATE TRIGGER update_goal_progress_trigger
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_goal_progress();

-- Triggers for updated_at
CREATE TRIGGER update_goal_categories_updated_at
  BEFORE UPDATE ON goal_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goal_milestones_updated_at
  BEFORE UPDATE ON goal_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default goal categories
INSERT INTO goal_categories (name, description, color, icon, is_system) VALUES
('Business', 'Professional and entrepreneurial goals', '#3B82F6', 'briefcase', true),
('Health', 'Physical and mental wellness goals', '#EF4444', 'heart', true),
('Learning', 'Education and skill development', '#8B5CF6', 'book', true),
('Financial', 'Money and investment goals', '#10B981', 'dollar-sign', true),
('Personal', 'Self-improvement and lifestyle', '#F59E0B', 'user', true),
('Relationships', 'Social and family connections', '#EC4899', 'users', true),
('Spiritual', 'Purpose and meaning goals', '#6366F1', 'compass', true),
('Creative', 'Artistic and creative pursuits', '#F97316', 'palette', true)
ON CONFLICT (name) WHERE is_system = true DO NOTHING;