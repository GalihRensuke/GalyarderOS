/*
  # Analytics Views and Functions

  1. Views
    - `user_analytics_summary`
      - Comprehensive user statistics and progress
    
    - `goal_analytics`
      - Goal completion rates and trends
    
    - `habit_analytics`
      - Habit consistency and streak analysis
    
    - `insight_effectiveness`
      - AI insight performance metrics

  2. Functions
    - Analytics calculation functions
    - Trend analysis functions
    - Performance scoring functions
*/

-- User Analytics Summary View
CREATE OR REPLACE VIEW user_analytics_summary AS
SELECT 
  up.id as user_id,
  up.email,
  up.full_name,
  up.level,
  up.experience_points,
  up.optimization_score,
  
  -- Goal Statistics
  COALESCE(goal_stats.total_goals, 0) as total_goals,
  COALESCE(goal_stats.active_goals, 0) as active_goals,
  COALESCE(goal_stats.completed_goals, 0) as completed_goals,
  COALESCE(goal_stats.goal_completion_rate, 0) as goal_completion_rate,
  COALESCE(goal_stats.avg_goal_progress, 0) as avg_goal_progress,
  
  -- Habit Statistics
  COALESCE(habit_stats.total_habits, 0) as total_habits,
  COALESCE(habit_stats.active_habits, 0) as active_habits,
  COALESCE(habit_stats.avg_streak, 0) as avg_current_streak,
  COALESCE(habit_stats.max_streak, 0) as max_streak,
  COALESCE(habit_stats.avg_success_rate, 0) as avg_habit_success_rate,
  
  -- Insight Statistics
  COALESCE(insight_stats.total_insights, 0) as total_insights,
  COALESCE(insight_stats.unread_insights, 0) as unread_insights,
  COALESCE(insight_stats.avg_confidence, 0) as avg_insight_confidence,
  COALESCE(insight_stats.high_priority_insights, 0) as high_priority_insights,
  
  -- Session Statistics
  COALESCE(session_stats.total_sessions, 0) as total_sessions,
  COALESCE(session_stats.total_session_time, 0) as total_session_time_minutes,
  COALESCE(session_stats.avg_productivity, 0) as avg_session_productivity,
  COALESCE(session_stats.avg_focus, 0) as avg_session_focus,
  
  -- Reflection Statistics
  COALESCE(reflection_stats.daily_reflections, 0) as daily_reflections_count,
  COALESCE(reflection_stats.weekly_reflections, 0) as weekly_reflections_count,
  COALESCE(reflection_stats.avg_mood, 0) as avg_daily_mood,
  COALESCE(reflection_stats.avg_energy, 0) as avg_daily_energy,
  
  -- Domain Scores
  COALESCE(domain_stats.avg_domain_score, 0) as avg_domain_score,
  COALESCE(domain_stats.physical_score, 0) as physical_domain_score,
  COALESCE(domain_stats.mental_score, 0) as mental_domain_score,
  COALESCE(domain_stats.spiritual_score, 0) as spiritual_domain_score,
  COALESCE(domain_stats.financial_score, 0) as financial_domain_score,
  
  up.created_at,
  up.updated_at

FROM user_profiles up

-- Goal Statistics Subquery
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_goals,
    COUNT(*) FILTER (WHERE status = 'active') as active_goals,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_goals,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*))
      ELSE 0 
    END as goal_completion_rate,
    AVG(progress) as avg_goal_progress
  FROM goals 
  GROUP BY user_id
) goal_stats ON up.id = goal_stats.user_id

-- Habit Statistics Subquery
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_habits,
    COUNT(*) FILTER (WHERE is_active = true) as active_habits,
    AVG(current_streak) as avg_streak,
    MAX(longest_streak) as max_streak,
    AVG(success_rate) as avg_success_rate
  FROM habits 
  GROUP BY user_id
) habit_stats ON up.id = habit_stats.user_id

-- Insight Statistics Subquery
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_insights,
    COUNT(*) FILTER (WHERE is_read = false) as unread_insights,
    AVG(confidence) as avg_confidence,
    COUNT(*) FILTER (WHERE priority IN ('high', 'critical')) as high_priority_insights
  FROM life_insights 
  WHERE is_archived = false
  GROUP BY user_id
) insight_stats ON up.id = insight_stats.user_id

-- Session Statistics Subquery
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_sessions,
    SUM(actual_duration) as total_session_time,
    AVG(productivity_rating) as avg_productivity,
    AVG(focus_level) as avg_focus
  FROM life_sessions 
  WHERE is_completed = true
  GROUP BY user_id
) session_stats ON up.id = session_stats.user_id

-- Reflection Statistics Subquery
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(DISTINCT reflection_date) as daily_reflections,
    COUNT(DISTINCT week_start_date) as weekly_reflections,
    AVG(overall_mood) as avg_mood,
    AVG(energy_level) as avg_energy
  FROM daily_reflections dr
  FULL OUTER JOIN weekly_reflections wr ON dr.user_id = wr.user_id
  GROUP BY user_id
) reflection_stats ON up.id = reflection_stats.user_id

-- Domain Statistics Subquery
LEFT JOIN (
  SELECT 
    user_id,
    AVG(current_score) as avg_domain_score,
    AVG(current_score) FILTER (WHERE name = 'Physical') as physical_score,
    AVG(current_score) FILTER (WHERE name = 'Mental') as mental_score,
    AVG(current_score) FILTER (WHERE name = 'Spiritual') as spiritual_score,
    AVG(current_score) FILTER (WHERE name = 'Financial') as financial_score
  FROM life_domains 
  WHERE is_active = true
  GROUP BY user_id
) domain_stats ON up.id = domain_stats.user_id;

-- Goal Analytics View
CREATE OR REPLACE VIEW goal_analytics AS
SELECT 
  g.id,
  g.user_id,
  g.title,
  g.category_id,
  gc.name as category_name,
  g.priority,
  g.status,
  g.progress,
  g.target_value,
  g.current_value,
  g.deadline,
  g.start_date,
  
  -- Time metrics
  CASE 
    WHEN g.deadline IS NOT NULL THEN 
      g.deadline - CURRENT_DATE 
    ELSE NULL 
  END as days_until_deadline,
  
  CURRENT_DATE - g.start_date as days_since_start,
  
  -- Progress metrics
  CASE 
    WHEN g.deadline IS NOT NULL AND g.start_date IS NOT NULL THEN
      CASE 
        WHEN g.deadline - g.start_date = 0 THEN 100
        ELSE ((CURRENT_DATE - g.start_date) * 100.0 / (g.deadline - g.start_date))
      END
    ELSE NULL 
  END as time_progress_percentage,
  
  -- Milestone metrics
  COALESCE(milestone_stats.total_milestones, 0) as total_milestones,
  COALESCE(milestone_stats.completed_milestones, 0) as completed_milestones,
  COALESCE(milestone_stats.milestone_completion_rate, 0) as milestone_completion_rate,
  
  -- Progress history
  COALESCE(progress_stats.total_updates, 0) as progress_updates_count,
  COALESCE(progress_stats.avg_progress_delta, 0) as avg_progress_delta,
  
  g.created_at,
  g.updated_at

FROM goals g
LEFT JOIN goal_categories gc ON g.category_id = gc.id

-- Milestone Statistics
LEFT JOIN (
  SELECT 
    goal_id,
    COUNT(*) as total_milestones,
    COUNT(*) FILTER (WHERE completed = true) as completed_milestones,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE completed = true) * 100.0 / COUNT(*))
      ELSE 0 
    END as milestone_completion_rate
  FROM goal_milestones 
  GROUP BY goal_id
) milestone_stats ON g.id = milestone_stats.goal_id

-- Progress Statistics
LEFT JOIN (
  SELECT 
    goal_id,
    COUNT(*) as total_updates,
    AVG(progress_delta) as avg_progress_delta
  FROM goal_progress_history 
  GROUP BY goal_id
) progress_stats ON g.id = progress_stats.goal_id;

-- Habit Analytics View
CREATE OR REPLACE VIEW habit_analytics AS
SELECT 
  h.id,
  h.user_id,
  h.name,
  h.category_id,
  hc.name as category_name,
  h.frequency,
  h.habit_type,
  h.current_streak,
  h.longest_streak,
  h.total_completions,
  h.success_rate,
  h.is_active,
  
  -- Recent performance (last 30 days)
  COALESCE(recent_stats.completions_last_30_days, 0) as completions_last_30_days,
  COALESCE(recent_stats.success_rate_last_30_days, 0) as success_rate_last_30_days,
  
  -- Weekly performance
  COALESCE(weekly_stats.completions_this_week, 0) as completions_this_week,
  COALESCE(weekly_stats.completions_last_week, 0) as completions_last_week,
  
  -- Streak analysis
  COALESCE(streak_stats.total_streaks, 0) as total_streaks,
  COALESCE(streak_stats.avg_streak_length, 0) as avg_streak_length,
  
  h.created_at,
  h.updated_at

FROM habits h
LEFT JOIN habit_categories hc ON h.category_id = hc.id

-- Recent Statistics (Last 30 days)
LEFT JOIN (
  SELECT 
    habit_id,
    COUNT(*) FILTER (WHERE completed = true) as completions_last_30_days,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE completed = true) * 100.0 / COUNT(*))
      ELSE 0 
    END as success_rate_last_30_days
  FROM habit_completions 
  WHERE completion_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY habit_id
) recent_stats ON h.id = recent_stats.habit_id

-- Weekly Statistics
LEFT JOIN (
  SELECT 
    habit_id,
    COUNT(*) FILTER (
      WHERE completed = true 
      AND completion_date >= date_trunc('week', CURRENT_DATE)
    ) as completions_this_week,
    COUNT(*) FILTER (
      WHERE completed = true 
      AND completion_date >= date_trunc('week', CURRENT_DATE) - INTERVAL '7 days'
      AND completion_date < date_trunc('week', CURRENT_DATE)
    ) as completions_last_week
  FROM habit_completions 
  GROUP BY habit_id
) weekly_stats ON h.id = weekly_stats.habit_id

-- Streak Statistics
LEFT JOIN (
  SELECT 
    habit_id,
    COUNT(*) as total_streaks,
    AVG(streak_length) as avg_streak_length
  FROM habit_streaks 
  GROUP BY habit_id
) streak_stats ON h.id = streak_stats.habit_id;

-- Function to calculate user optimization score
CREATE OR REPLACE FUNCTION calculate_optimization_score(user_uuid uuid)
RETURNS integer AS $$
DECLARE
  goal_score numeric := 0;
  habit_score numeric := 0;
  domain_score numeric := 0;
  session_score numeric := 0;
  final_score integer := 50;
BEGIN
  -- Goal Score (25% weight)
  SELECT COALESCE(AVG(progress), 0) INTO goal_score
  FROM goals 
  WHERE user_id = user_uuid AND status = 'active';
  
  -- Habit Score (30% weight)
  SELECT COALESCE(AVG(success_rate), 0) INTO habit_score
  FROM habits 
  WHERE user_id = user_uuid AND is_active = true;
  
  -- Domain Score (30% weight)
  SELECT COALESCE(AVG(current_score), 0) INTO domain_score
  FROM life_domains 
  WHERE user_id = user_uuid AND is_active = true;
  
  -- Session Score (15% weight) - based on recent productivity
  SELECT COALESCE(AVG(productivity_rating * 10), 50) INTO session_score
  FROM life_sessions 
  WHERE user_id = user_uuid 
    AND is_completed = true 
    AND start_time >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Calculate weighted final score
  final_score := ROUND(
    (goal_score * 0.25) + 
    (habit_score * 0.30) + 
    (domain_score * 0.30) + 
    (session_score * 0.15)
  )::integer;
  
  RETURN GREATEST(0, LEAST(100, final_score));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user optimization scores
CREATE OR REPLACE FUNCTION update_user_optimization_scores()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    optimization_score = calculate_optimization_score(id),
    updated_at = now()
  WHERE id IN (
    SELECT DISTINCT user_id 
    FROM (
      SELECT user_id FROM goals WHERE updated_at >= CURRENT_DATE - INTERVAL '1 day'
      UNION
      SELECT user_id FROM habits WHERE updated_at >= CURRENT_DATE - INTERVAL '1 day'
      UNION
      SELECT user_id FROM life_domains WHERE updated_at >= CURRENT_DATE - INTERVAL '1 day'
      UNION
      SELECT user_id FROM life_sessions WHERE updated_at >= CURRENT_DATE - INTERVAL '1 day'
    ) recent_updates
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;