/*
  # Performance Indexes and Optimizations

  1. Indexes
    - Primary lookup indexes for common queries
    - Composite indexes for complex filtering
    - Partial indexes for active records
    - Text search indexes

  2. Performance Optimizations
    - Query optimization hints
    - Materialized views for heavy analytics
    - Partitioning for large tables
*/

-- User and Profile Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Goal System Indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_priority ON goals(priority);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_user_active ON goals(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_goals_category_id ON goals(category_id);

CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_due_date ON goal_milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_completed ON goal_milestones(completed);

CREATE INDEX IF NOT EXISTS idx_goal_progress_history_goal_id ON goal_progress_history(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_history_created_at ON goal_progress_history(created_at);

-- Habit System Indexes
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_is_active ON habits(is_active);
CREATE INDEX IF NOT EXISTS idx_habits_user_active ON habits(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_habits_category_id ON habits(category_id);
CREATE INDEX IF NOT EXISTS idx_habits_frequency ON habits(frequency);

CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date ON habit_completions(habit_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_completed ON habit_completions(completed);

CREATE INDEX IF NOT EXISTS idx_habit_streaks_habit_id ON habit_streaks(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_streaks_current ON habit_streaks(is_current);
CREATE INDEX IF NOT EXISTS idx_habit_streaks_dates ON habit_streaks(start_date, end_date);

-- Insights System Indexes
CREATE INDEX IF NOT EXISTS idx_life_insights_user_id ON life_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_life_insights_domain_id ON life_insights(domain_id);
CREATE INDEX IF NOT EXISTS idx_life_insights_priority ON life_insights(priority);
CREATE INDEX IF NOT EXISTS idx_life_insights_is_read ON life_insights(is_read);
CREATE INDEX IF NOT EXISTS idx_life_insights_is_archived ON life_insights(is_archived);
CREATE INDEX IF NOT EXISTS idx_life_insights_user_unread ON life_insights(user_id) WHERE is_read = false AND is_archived = false;
CREATE INDEX IF NOT EXISTS idx_life_insights_created_at ON life_insights(created_at);
CREATE INDEX IF NOT EXISTS idx_life_insights_timeframe ON life_insights(timeframe);

CREATE INDEX IF NOT EXISTS idx_insight_actions_insight_id ON insight_actions(insight_id);
CREATE INDEX IF NOT EXISTS idx_insight_actions_completed ON insight_actions(is_completed);

CREATE INDEX IF NOT EXISTS idx_life_domains_user_id ON life_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_life_domains_is_active ON life_domains(is_active);
CREATE INDEX IF NOT EXISTS idx_life_domains_user_active ON life_domains(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_domain_metrics_domain_id ON domain_metrics(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_metrics_last_updated ON domain_metrics(last_updated);

-- Sessions and Reflections Indexes
CREATE INDEX IF NOT EXISTS idx_life_sessions_user_id ON life_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_life_sessions_session_type ON life_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_life_sessions_start_time ON life_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_life_sessions_is_completed ON life_sessions(is_completed);
CREATE INDEX IF NOT EXISTS idx_life_sessions_user_completed ON life_sessions(user_id) WHERE is_completed = true;

CREATE INDEX IF NOT EXISTS idx_daily_reflections_user_id ON daily_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_reflections_date ON daily_reflections(reflection_date);
CREATE INDEX IF NOT EXISTS idx_daily_reflections_user_date ON daily_reflections(user_id, reflection_date);

CREATE INDEX IF NOT EXISTS idx_weekly_reflections_user_id ON weekly_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reflections_week_start ON weekly_reflections(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_reflections_user_week ON weekly_reflections(user_id, week_start_date);

CREATE INDEX IF NOT EXISTS idx_monthly_reviews_user_id ON monthly_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reviews_month_year ON monthly_reviews(month_year);

-- Notion Integration Indexes
CREATE INDEX IF NOT EXISTS idx_notion_integrations_user_id ON notion_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_notion_integrations_connected ON notion_integrations(is_connected);
CREATE INDEX IF NOT EXISTS idx_notion_integrations_status ON notion_integrations(connection_status);

CREATE INDEX IF NOT EXISTS idx_notion_database_mappings_integration_id ON notion_database_mappings(integration_id);
CREATE INDEX IF NOT EXISTS idx_notion_database_mappings_data_type ON notion_database_mappings(data_type);
CREATE INDEX IF NOT EXISTS idx_notion_database_mappings_active ON notion_database_mappings(is_active);

CREATE INDEX IF NOT EXISTS idx_notion_sync_logs_integration_id ON notion_sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_notion_sync_logs_status ON notion_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_notion_sync_logs_started_at ON notion_sync_logs(started_at);

CREATE INDEX IF NOT EXISTS idx_notion_sync_queue_integration_id ON notion_sync_queue(integration_id);
CREATE INDEX IF NOT EXISTS idx_notion_sync_queue_status ON notion_sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_notion_sync_queue_scheduled_for ON notion_sync_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notion_sync_queue_priority ON notion_sync_queue(priority);

-- Text Search Indexes
CREATE INDEX IF NOT EXISTS idx_goals_title_search ON goals USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_goals_description_search ON goals USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_habits_name_search ON habits USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_life_insights_title_search ON life_insights USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_life_insights_message_search ON life_insights USING gin(to_tsvector('english', message));

-- Array Indexes for Tags
CREATE INDEX IF NOT EXISTS idx_goals_tags ON goals USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_habits_tags ON habits USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_life_sessions_tags ON life_sessions USING gin(tags);

-- JSONB Indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_notification_settings ON user_preferences USING gin(notification_settings);
CREATE INDEX IF NOT EXISTS idx_user_preferences_privacy_settings ON user_preferences USING gin(privacy_settings);
CREATE INDEX IF NOT EXISTS idx_goals_metadata ON goals USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_habits_metadata ON habits USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_life_insights_data_source ON life_insights USING gin(data_source);
CREATE INDEX IF NOT EXISTS idx_life_sessions_metadata ON life_sessions USING gin(metadata);

-- Partial Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_goals_active_deadline ON goals(deadline) WHERE status = 'active' AND deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_habits_active_reminder ON habits(reminder_time) WHERE is_active = true AND reminder_enabled = true;
CREATE INDEX IF NOT EXISTS idx_insights_high_priority_unread ON life_insights(created_at) WHERE priority IN ('high', 'critical') AND is_read = false;

-- Composite Indexes for Common Queries
CREATE INDEX IF NOT EXISTS idx_goals_user_status_priority ON goals(user_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_habits_user_active_category ON habits(user_id, is_active, category_id);
CREATE INDEX IF NOT EXISTS idx_insights_user_domain_priority ON life_insights(user_id, domain_id, priority);
CREATE INDEX IF NOT EXISTS idx_sessions_user_type_date ON life_sessions(user_id, session_type, start_time);

-- Materialized View for User Dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS user_dashboard_stats AS
SELECT 
  up.id as user_id,
  up.optimization_score,
  
  -- Today's stats
  COALESCE(today_habits.completed_today, 0) as habits_completed_today,
  COALESCE(today_habits.total_today, 0) as habits_total_today,
  COALESCE(today_sessions.session_time_today, 0) as session_time_today,
  
  -- This week's stats
  COALESCE(week_stats.goals_progressed_week, 0) as goals_progressed_this_week,
  COALESCE(week_stats.avg_mood_week, 0) as avg_mood_this_week,
  COALESCE(week_stats.avg_energy_week, 0) as avg_energy_this_week,
  
  -- Unread counts
  COALESCE(unread_counts.unread_insights, 0) as unread_insights,
  COALESCE(unread_counts.high_priority_insights, 0) as high_priority_insights,
  
  now() as last_updated

FROM user_profiles up

-- Today's Habit Stats
LEFT JOIN (
  SELECT 
    h.user_id,
    COUNT(*) as total_today,
    COUNT(*) FILTER (WHERE hc.completed = true) as completed_today
  FROM habits h
  LEFT JOIN habit_completions hc ON h.id = hc.habit_id AND hc.completion_date = CURRENT_DATE
  WHERE h.is_active = true
  GROUP BY h.user_id
) today_habits ON up.id = today_habits.user_id

-- Today's Session Stats
LEFT JOIN (
  SELECT 
    user_id,
    COALESCE(SUM(actual_duration), 0) as session_time_today
  FROM life_sessions
  WHERE DATE(start_time) = CURRENT_DATE AND is_completed = true
  GROUP BY user_id
) today_sessions ON up.id = today_sessions.user_id

-- This Week's Stats
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(DISTINCT goal_id) as goals_progressed_week,
    AVG(overall_mood) as avg_mood_week,
    AVG(energy_level) as avg_energy_week
  FROM (
    SELECT DISTINCT gph.goal_id, g.user_id
    FROM goal_progress_history gph
    JOIN goals g ON gph.goal_id = g.id
    WHERE gph.created_at >= date_trunc('week', CURRENT_DATE)
  ) goal_progress
  FULL OUTER JOIN daily_reflections dr ON goal_progress.user_id = dr.user_id
    AND dr.reflection_date >= date_trunc('week', CURRENT_DATE)::date
  GROUP BY user_id
) week_stats ON up.id = week_stats.user_id

-- Unread Counts
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as unread_insights,
    COUNT(*) FILTER (WHERE priority IN ('high', 'critical')) as high_priority_insights
  FROM life_insights
  WHERE is_read = false AND is_archived = false
  GROUP BY user_id
) unread_counts ON up.id = unread_counts.user_id;

-- Create unique index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_dashboard_stats_user_id ON user_dashboard_stats(user_id);

-- Function to refresh dashboard stats
CREATE OR REPLACE FUNCTION refresh_user_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;