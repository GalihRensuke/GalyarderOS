/*
  # Comprehensive Backend Architecture Database Schema

  1. Core Tables
    - All tables for the 5 core modules
    - Proper relationships and constraints
    - Row Level Security (RLS) enabled
    - Comprehensive indexes for performance

  2. Security
    - RLS policies for all tables
    - User-based access control
    - Audit trails where needed

  3. Performance
    - Optimized indexes
    - Efficient foreign key relationships
    - Proper data types for scalability
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- RITUAL ENGINE TABLES
-- =============================================

-- Rituals table
CREATE TABLE IF NOT EXISTS rituals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('morning', 'evening', 'work', 'health', 'mindfulness', 'custom')),
  type text NOT NULL CHECK (type IN ('habit', 'routine', 'sequence')),
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  custom_frequency text,
  duration_minutes integer,
  is_active boolean DEFAULT true,
  streak_count integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  total_completions integer DEFAULT 0,
  difficulty_level integer CHECK (difficulty_level BETWEEN 1 AND 5),
  tags text[] DEFAULT '{}',
  reminder_time time,
  reminder_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ritual steps table
CREATE TABLE IF NOT EXISTS ritual_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_id uuid NOT NULL REFERENCES rituals(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  name text NOT NULL,
  description text,
  duration_minutes integer,
  is_required boolean DEFAULT true,
  completion_criteria text,
  created_at timestamptz DEFAULT now()
);

-- Ritual completions table
CREATE TABLE IF NOT EXISTS ritual_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_id uuid NOT NULL REFERENCES rituals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  duration_minutes integer,
  mood_before integer CHECK (mood_before BETWEEN 1 AND 10),
  mood_after integer CHECK (mood_after BETWEEN 1 AND 10),
  energy_before integer CHECK (energy_before BETWEEN 1 AND 10),
  energy_after integer CHECK (energy_after BETWEEN 1 AND 10),
  notes text,
  completed_steps text[] DEFAULT '{}',
  skipped_steps text[] DEFAULT '{}'
);

-- Ritual templates table
CREATE TABLE IF NOT EXISTS ritual_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  difficulty_level integer CHECK (difficulty_level BETWEEN 1 AND 5),
  estimated_duration integer,
  steps jsonb NOT NULL DEFAULT '[]',
  tags text[] DEFAULT '{}',
  popularity_score integer DEFAULT 0,
  created_by uuid REFERENCES user_profiles(id),
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- FLOW STATE TABLES
-- =============================================

-- Flow sessions table
CREATE TABLE IF NOT EXISTS flow_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('deep_work', 'creative', 'learning', 'problem_solving', 'custom')),
  planned_duration integer NOT NULL,
  actual_duration integer,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'paused', 'completed', 'cancelled')),
  focus_score integer CHECK (focus_score BETWEEN 1 AND 10),
  productivity_score integer CHECK (productivity_score BETWEEN 1 AND 10),
  distraction_count integer DEFAULT 0,
  break_count integer DEFAULT 0,
  environment_settings jsonb DEFAULT '{}',
  metrics jsonb DEFAULT '{}',
  notes text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Flow distractions table
CREATE TABLE IF NOT EXISTS flow_distractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES flow_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  source text NOT NULL,
  duration_seconds integer NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Focus intervals table
CREATE TABLE IF NOT EXISTS focus_intervals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES flow_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  focus_level integer CHECK (focus_level BETWEEN 1 AND 10),
  activity_type text,
  interruptions integer DEFAULT 0
);

-- Distraction blocks table
CREATE TABLE IF NOT EXISTS distraction_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES flow_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  blocked_websites text[] DEFAULT '{}',
  enabled_at timestamptz DEFAULT now(),
  disabled_at timestamptz
);

-- Flow optimizations table
CREATE TABLE IF NOT EXISTS flow_optimizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  optimal_duration integer,
  best_time_of_day text,
  preferred_environment jsonb DEFAULT '{}',
  peak_performance_indicators jsonb DEFAULT '{}',
  improvement_suggestions text[] DEFAULT '{}',
  last_updated timestamptz DEFAULT now()
);

-- =============================================
-- KNOWLEDGE SYNTHESIS TABLES
-- =============================================

-- Knowledge nodes table
CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('note', 'article', 'book', 'video', 'podcast', 'idea', 'quote')),
  source text,
  author text,
  url text,
  tags text[] DEFAULT '{}',
  category text,
  importance_score integer DEFAULT 5 CHECK (importance_score BETWEEN 1 AND 10),
  connections text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed timestamptz DEFAULT now(),
  access_count integer DEFAULT 0
);

-- Knowledge connections table
CREATE TABLE IF NOT EXISTS knowledge_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  source_node_id uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  target_node_id uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  connection_type text NOT NULL CHECK (connection_type IN ('related', 'contradicts', 'supports', 'builds_on', 'example_of')),
  strength real DEFAULT 0.5 CHECK (strength BETWEEN 0 AND 1),
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_node_id, target_node_id)
);

-- Knowledge clusters table
CREATE TABLE IF NOT EXISTS knowledge_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  node_ids text[] NOT NULL,
  center_node_id uuid REFERENCES knowledge_nodes(id),
  coherence_score real DEFAULT 0 CHECK (coherence_score BETWEEN 0 AND 1),
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- REFLECTION INTELLIGENCE TABLES
-- =============================================

-- Reflection prompts table
CREATE TABLE IF NOT EXISTS reflection_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('daily', 'weekly', 'monthly', 'goal_review', 'life_audit', 'custom')),
  type text NOT NULL CHECK (type IN ('open_ended', 'scale', 'multiple_choice', 'comparative')),
  question text NOT NULL,
  sub_questions text[] DEFAULT '{}',
  context text,
  difficulty_level integer CHECK (difficulty_level BETWEEN 1 AND 5),
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Reflection entries table
CREATE TABLE IF NOT EXISTS reflection_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  prompt_id uuid REFERENCES reflection_prompts(id),
  type text NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'spontaneous')),
  title text NOT NULL,
  content text NOT NULL,
  mood_score integer CHECK (mood_score BETWEEN 1 AND 10),
  energy_score integer CHECK (energy_score BETWEEN 1 AND 10),
  satisfaction_score integer CHECK (satisfaction_score BETWEEN 1 AND 10),
  stress_level integer CHECK (stress_level BETWEEN 1 AND 10),
  key_insights text[] DEFAULT '{}',
  action_items text[] DEFAULT '{}',
  gratitude_items text[] DEFAULT '{}',
  challenges_faced text[] DEFAULT '{}',
  wins_celebrated text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reflection insights table
CREATE TABLE IF NOT EXISTS reflection_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('pattern', 'trend', 'correlation', 'anomaly', 'recommendation')),
  title text NOT NULL,
  description text NOT NULL,
  confidence_score integer CHECK (confidence_score BETWEEN 0 AND 100),
  supporting_data jsonb DEFAULT '{}',
  time_period text,
  category text,
  actionable boolean DEFAULT false,
  action_suggestions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- LIFE ANALYTICS TABLES
-- =============================================

-- Life metrics table
CREATE TABLE IF NOT EXISTS life_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('physical', 'mental', 'spiritual', 'financial', 'social', 'professional')),
  name text NOT NULL,
  value real NOT NULL,
  unit text NOT NULL,
  target_value real,
  measurement_type text NOT NULL CHECK (measurement_type IN ('counter', 'gauge', 'timer', 'percentage')),
  data_source text NOT NULL CHECK (data_source IN ('manual', 'automated', 'calculated')),
  recorded_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Analytics dashboards table
CREATE TABLE IF NOT EXISTS analytics_dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  widgets jsonb DEFAULT '[]',
  layout jsonb DEFAULT '{}',
  is_default boolean DEFAULT false,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Personal reports table
CREATE TABLE IF NOT EXISTS personal_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  summary text,
  key_metrics jsonb DEFAULT '{}',
  achievements text[] DEFAULT '{}',
  areas_for_improvement text[] DEFAULT '{}',
  recommendations text[] DEFAULT '{}',
  trend_analysis jsonb DEFAULT '[]',
  generated_at timestamptz DEFAULT now()
);

-- Automated collections table
CREATE TABLE IF NOT EXISTS automated_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  data_source text NOT NULL,
  collection_frequency text NOT NULL CHECK (collection_frequency IN ('hourly', 'daily', 'weekly')),
  api_endpoint text,
  transformation_rules jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_collection timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Ritual Engine indexes
CREATE INDEX IF NOT EXISTS idx_rituals_user_id ON rituals(user_id);
CREATE INDEX IF NOT EXISTS idx_rituals_category ON rituals(category);
CREATE INDEX IF NOT EXISTS idx_rituals_is_active ON rituals(is_active);
CREATE INDEX IF NOT EXISTS idx_ritual_steps_ritual_id ON ritual_steps(ritual_id);
CREATE INDEX IF NOT EXISTS idx_ritual_completions_user_id ON ritual_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_ritual_completions_ritual_id ON ritual_completions(ritual_id);
CREATE INDEX IF NOT EXISTS idx_ritual_completions_completed_at ON ritual_completions(completed_at);

-- Flow State indexes
CREATE INDEX IF NOT EXISTS idx_flow_sessions_user_id ON flow_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_flow_sessions_start_time ON flow_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_flow_sessions_status ON flow_sessions(status);
CREATE INDEX IF NOT EXISTS idx_flow_distractions_session_id ON flow_distractions(session_id);
CREATE INDEX IF NOT EXISTS idx_focus_intervals_session_id ON focus_intervals(session_id);

-- Knowledge Synthesis indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_user_id ON knowledge_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_type ON knowledge_nodes(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_category ON knowledge_nodes(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_tags ON knowledge_nodes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_connections_source ON knowledge_connections(source_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_connections_target ON knowledge_connections(target_node_id);

-- Reflection Intelligence indexes
CREATE INDEX IF NOT EXISTS idx_reflection_entries_user_id ON reflection_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_reflection_entries_type ON reflection_entries(type);
CREATE INDEX IF NOT EXISTS idx_reflection_entries_created_at ON reflection_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_reflection_insights_user_id ON reflection_insights(user_id);

-- Life Analytics indexes
CREATE INDEX IF NOT EXISTS idx_life_metrics_user_id ON life_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_life_metrics_category ON life_metrics(category);
CREATE INDEX IF NOT EXISTS idx_life_metrics_name ON life_metrics(name);
CREATE INDEX IF NOT EXISTS idx_life_metrics_recorded_at ON life_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_user_id ON analytics_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_reports_user_id ON personal_reports(user_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE rituals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_templates ENABLE ROW LEVEL SECURITY;

ALTER TABLE flow_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_distractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_intervals ENABLE ROW LEVEL SECURITY;
ALTER TABLE distraction_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_optimizations ENABLE ROW LEVEL SECURITY;

ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_clusters ENABLE ROW LEVEL SECURITY;

ALTER TABLE reflection_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_insights ENABLE ROW LEVEL SECURITY;

ALTER TABLE life_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_collections ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Ritual Engine policies
CREATE POLICY "Users can manage own rituals" ON rituals
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage ritual steps for own rituals" ON ritual_steps
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM rituals WHERE rituals.id = ritual_steps.ritual_id AND rituals.user_id = auth.uid()));

CREATE POLICY "Users can manage own ritual completions" ON ritual_completions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view public ritual templates" ON ritual_templates
  FOR SELECT TO authenticated
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can manage own ritual templates" ON ritual_templates
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Flow State policies
CREATE POLICY "Users can manage own flow sessions" ON flow_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own flow distractions" ON flow_distractions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own focus intervals" ON focus_intervals
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own distraction blocks" ON distraction_blocks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own flow optimizations" ON flow_optimizations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Knowledge Synthesis policies
CREATE POLICY "Users can manage own knowledge nodes" ON knowledge_nodes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own knowledge connections" ON knowledge_connections
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own knowledge clusters" ON knowledge_clusters
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reflection Intelligence policies
CREATE POLICY "Users can view all reflection prompts" ON reflection_prompts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can manage own reflection entries" ON reflection_entries
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own reflection insights" ON reflection_insights
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Life Analytics policies
CREATE POLICY "Users can manage own life metrics" ON life_metrics
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own analytics dashboards" ON analytics_dashboards
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own personal reports" ON personal_reports
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own automated collections" ON automated_collections
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to increment distraction count
CREATE OR REPLACE FUNCTION increment_distraction_count(session_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE flow_sessions 
  SET distraction_count = distraction_count + 1 
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment node access count
CREATE OR REPLACE FUNCTION increment_node_access(node_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE knowledge_nodes 
  SET access_count = access_count + 1,
      last_accessed = now()
  WHERE id = node_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add node connection
CREATE OR REPLACE FUNCTION add_node_connection(node_id uuid, connection_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE knowledge_nodes 
  SET connections = array_append(connections, connection_id::text)
  WHERE id = node_id AND NOT (connection_id::text = ANY(connections));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove node connection
CREATE OR REPLACE FUNCTION remove_node_connection(node_id uuid, connection_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE knowledge_nodes 
  SET connections = array_remove(connections, connection_id::text)
  WHERE id = node_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================

-- Update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_rituals_updated_at
  BEFORE UPDATE ON rituals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_nodes_updated_at
  BEFORE UPDATE ON knowledge_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_clusters_updated_at
  BEFORE UPDATE ON knowledge_clusters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reflection_entries_updated_at
  BEFORE UPDATE ON reflection_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_dashboards_updated_at
  BEFORE UPDATE ON analytics_dashboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();