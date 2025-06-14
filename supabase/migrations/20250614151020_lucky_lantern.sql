/*
  # AI Insights and Life Intelligence Schema

  1. New Tables
    - `life_insights`
      - AI-generated insights with confidence scores and action items
      - Categorized by life domains and priority levels
    
    - `insight_actions`
      - Specific action items from insights
      - Track completion and effectiveness
    
    - `life_domains`
      - Core life areas for optimization tracking
    
    - `domain_metrics`
      - Quantified metrics for each life domain

  2. Security
    - Enable RLS on all tables
    - Users can only access their own insights and metrics
*/

-- Life Domains Table
CREATE TABLE IF NOT EXISTS life_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'circle',
  weight numeric(3,2) DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1),
  target_score integer DEFAULT 80 CHECK (target_score >= 0 AND target_score <= 100),
  current_score integer DEFAULT 50 CHECK (current_score >= 0 AND current_score <= 100),
  is_system boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Domain Metrics Table
CREATE TABLE IF NOT EXISTS domain_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid REFERENCES life_domains(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  value numeric NOT NULL,
  target_value numeric,
  unit text,
  metric_type text DEFAULT 'gauge' CHECK (metric_type IN ('gauge', 'counter', 'percentage', 'rating')),
  trend text DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Life Insights Table
CREATE TABLE IF NOT EXISTS life_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  domain_id uuid REFERENCES life_domains(id) ON DELETE SET NULL,
  title text NOT NULL,
  message text NOT NULL,
  insight_type text DEFAULT 'optimization' CHECK (insight_type IN ('optimization', 'warning', 'achievement', 'trend', 'recommendation')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  confidence numeric(5,2) DEFAULT 85 CHECK (confidence >= 0 AND confidence <= 100),
  timeframe text DEFAULT 'this_week' CHECK (timeframe IN ('immediate', 'this_week', 'this_month', 'long_term')),
  category text NOT NULL,
  domain text NOT NULL,
  related_domains text[] DEFAULT '{}',
  data_source jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  effectiveness_rating integer CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  user_feedback text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insight Actions Table
CREATE TABLE IF NOT EXISTS insight_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id uuid REFERENCES life_insights(id) ON DELETE CASCADE NOT NULL,
  action_text text NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  effectiveness_rating integer CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  notes text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insight Feedback Table
CREATE TABLE IF NOT EXISTS insight_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id uuid REFERENCES life_insights(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_type text DEFAULT 'general' CHECK (feedback_type IN ('general', 'accuracy', 'usefulness', 'clarity')),
  comments text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE life_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for life_domains
CREATE POLICY "Users can manage own life domains"
  ON life_domains
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR is_system = true)
  WITH CHECK (auth.uid() = user_id);

-- Policies for domain_metrics
CREATE POLICY "Users can manage own domain metrics"
  ON domain_metrics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM life_domains 
      WHERE life_domains.id = domain_metrics.domain_id 
      AND (life_domains.user_id = auth.uid() OR life_domains.is_system = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM life_domains 
      WHERE life_domains.id = domain_metrics.domain_id 
      AND life_domains.user_id = auth.uid()
    )
  );

-- Policies for life_insights
CREATE POLICY "Users can manage own insights"
  ON life_insights
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for insight_actions
CREATE POLICY "Users can manage own insight actions"
  ON insight_actions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM life_insights 
      WHERE life_insights.id = insight_actions.insight_id 
      AND life_insights.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM life_insights 
      WHERE life_insights.id = insight_actions.insight_id 
      AND life_insights.user_id = auth.uid()
    )
  );

-- Policies for insight_feedback
CREATE POLICY "Users can manage own insight feedback"
  ON insight_feedback
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to calculate domain scores
CREATE OR REPLACE FUNCTION calculate_domain_score(domain_uuid uuid)
RETURNS integer AS $$
DECLARE
  score integer := 50;
  metric_count integer;
  avg_percentage numeric;
BEGIN
  -- Calculate average percentage of metrics meeting targets
  SELECT 
    COUNT(*),
    AVG(
      CASE 
        WHEN target_value IS NOT NULL AND target_value > 0 THEN
          LEAST(100, (value / target_value) * 100)
        ELSE 50
      END
    )
  INTO metric_count, avg_percentage
  FROM domain_metrics 
  WHERE domain_id = domain_uuid;
  
  IF metric_count > 0 THEN
    score := ROUND(avg_percentage)::integer;
  END IF;
  
  RETURN GREATEST(0, LEAST(100, score));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update domain scores
CREATE OR REPLACE FUNCTION update_domain_scores()
RETURNS trigger AS $$
BEGIN
  UPDATE life_domains 
  SET 
    current_score = calculate_domain_score(NEW.domain_id),
    updated_at = now()
  WHERE id = NEW.domain_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for domain score updates
CREATE TRIGGER update_domain_scores_trigger
  AFTER INSERT OR UPDATE OR DELETE ON domain_metrics
  FOR EACH ROW EXECUTE FUNCTION update_domain_scores();

-- Triggers for updated_at
CREATE TRIGGER update_life_domains_updated_at
  BEFORE UPDATE ON life_domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_life_insights_updated_at
  BEFORE UPDATE ON life_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insight_actions_updated_at
  BEFORE UPDATE ON insight_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default life domains
INSERT INTO life_domains (name, description, color, icon, is_system) VALUES
('Physical', 'Health, fitness, and physical well-being', '#EF4444', 'activity', true),
('Mental', 'Cognitive health, learning, and mental clarity', '#3B82F6', 'brain', true),
('Spiritual', 'Purpose, values alignment, and inner peace', '#8B5CF6', 'heart', true),
('Financial', 'Wealth building, financial security, and abundance', '#10B981', 'dollar-sign', true),
('Social', 'Relationships, community, and social connections', '#EC4899', 'users', true),
('Professional', 'Career growth, skills, and professional development', '#F59E0B', 'briefcase', true),
('Creative', 'Artistic expression, creativity, and innovation', '#F97316', 'palette', true),
('Environmental', 'Living space, organization, and surroundings', '#06B6D4', 'home', true)
ON CONFLICT (name) WHERE is_system = true DO NOTHING;