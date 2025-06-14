/*
  # Scheduled Functions and Automation

  1. Scheduled Functions
    - Daily optimization score updates
    - Weekly reflection reminders
    - Monthly review generation
    - Habit streak calculations
    - Notion sync automation

  2. Triggers
    - Auto-generate insights on data changes
    - Update streaks on habit completions
    - Refresh materialized views
*/

-- Function to generate daily insights
CREATE OR REPLACE FUNCTION generate_daily_insights()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  insight_data jsonb;
BEGIN
  -- Loop through active users
  FOR user_record IN 
    SELECT id, email FROM user_profiles 
    WHERE updated_at >= CURRENT_DATE - INTERVAL '7 days'
  LOOP
    -- Generate habit consistency insight
    WITH habit_performance AS (
      SELECT 
        h.id,
        h.name,
        h.success_rate,
        h.current_streak,
        COUNT(hc.id) FILTER (WHERE hc.completion_date >= CURRENT_DATE - INTERVAL '7 days' AND hc.completed = true) as completions_week
      FROM habits h
      LEFT JOIN habit_completions hc ON h.id = hc.habit_id
      WHERE h.user_id = user_record.id AND h.is_active = true
      GROUP BY h.id, h.name, h.success_rate, h.current_streak
    )
    SELECT jsonb_build_object(
      'user_id', user_record.id,
      'weak_habits', jsonb_agg(jsonb_build_object('name', name, 'success_rate', success_rate)) FILTER (WHERE success_rate < 70),
      'strong_habits', jsonb_agg(jsonb_build_object('name', name, 'streak', current_streak)) FILTER (WHERE current_streak > 7),
      'this_week_performance', jsonb_agg(jsonb_build_object('name', name, 'completions', completions_week))
    ) INTO insight_data
    FROM habit_performance;

    -- Insert habit insight if there's data
    IF insight_data->>'weak_habits' != 'null' OR insight_data->>'strong_habits' != 'null' THEN
      INSERT INTO life_insights (
        user_id,
        title,
        message,
        insight_type,
        priority,
        confidence,
        timeframe,
        category,
        domain,
        data_source
      ) VALUES (
        user_record.id,
        'Daily Habit Performance Review',
        CASE 
          WHEN jsonb_array_length(insight_data->'weak_habits') > 0 THEN
            'Some habits need attention. Focus on consistency in your weaker areas while maintaining momentum in your strong habits.'
          ELSE
            'Great habit consistency! Your current streaks show strong commitment to your routines.'
        END,
        'optimization',
        CASE 
          WHEN jsonb_array_length(insight_data->'weak_habits') > 2 THEN 'high'
          WHEN jsonb_array_length(insight_data->'weak_habits') > 0 THEN 'medium'
          ELSE 'low'
        END,
        85,
        'this_week',
        'habits',
        'habits',
        insight_data
      );
    END IF;

    -- Generate goal progress insight
    WITH goal_performance AS (
      SELECT 
        g.id,
        g.title,
        g.progress,
        g.deadline,
        CASE 
          WHEN g.deadline IS NOT NULL THEN 
            EXTRACT(DAYS FROM g.deadline - CURRENT_DATE)
          ELSE NULL 
        END as days_remaining
      FROM goals g
      WHERE g.user_id = user_record.id AND g.status = 'active'
    )
    SELECT jsonb_build_object(
      'user_id', user_record.id,
      'behind_schedule', jsonb_agg(jsonb_build_object('title', title, 'progress', progress, 'days_remaining', days_remaining)) 
        FILTER (WHERE days_remaining IS NOT NULL AND progress < (100 - days_remaining * 2)),
      'on_track', jsonb_agg(jsonb_build_object('title', title, 'progress', progress)) 
        FILTER (WHERE progress >= 80),
      'needs_attention', jsonb_agg(jsonb_build_object('title', title, 'progress', progress)) 
        FILTER (WHERE progress < 30)
    ) INTO insight_data
    FROM goal_performance;

    -- Insert goal insight if there's data
    IF insight_data->>'behind_schedule' != 'null' OR insight_data->>'needs_attention' != 'null' THEN
      INSERT INTO life_insights (
        user_id,
        title,
        message,
        insight_type,
        priority,
        confidence,
        timeframe,
        category,
        domain,
        data_source
      ) VALUES (
        user_record.id,
        'Goal Progress Analysis',
        CASE 
          WHEN jsonb_array_length(insight_data->'behind_schedule') > 0 THEN
            'Some goals are falling behind schedule. Consider adjusting timelines or increasing focus on these areas.'
          WHEN jsonb_array_length(insight_data->'needs_attention') > 0 THEN
            'Several goals have low progress. Break them down into smaller milestones for better momentum.'
          ELSE
            'Your goals are progressing well. Keep up the consistent effort!'
        END,
        'optimization',
        CASE 
          WHEN jsonb_array_length(insight_data->'behind_schedule') > 1 THEN 'high'
          WHEN jsonb_array_length(insight_data->'needs_attention') > 0 THEN 'medium'
          ELSE 'low'
        END,
        90,
        'this_week',
        'goals',
        'goals',
        insight_data
      );
    END IF;

  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update all optimization scores
CREATE OR REPLACE FUNCTION update_all_optimization_scores()
RETURNS void AS $$
BEGIN
  -- Update optimization scores for all users
  UPDATE user_profiles 
  SET 
    optimization_score = calculate_optimization_score(id),
    updated_at = now();
  
  -- Refresh dashboard stats
  PERFORM refresh_user_dashboard_stats();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Archive old insights (older than 6 months)
  UPDATE life_insights 
  SET is_archived = true 
  WHERE created_at < CURRENT_DATE - INTERVAL '6 months' 
    AND is_archived = false;
  
  -- Delete old sync logs (older than 3 months)
  DELETE FROM notion_sync_logs 
  WHERE created_at < CURRENT_DATE - INTERVAL '3 months';
  
  -- Delete completed sync queue items (older than 1 week)
  DELETE FROM notion_sync_queue 
  WHERE status = 'completed' 
    AND updated_at < CURRENT_DATE - INTERVAL '1 week';
  
  -- Delete old goal progress history (keep last 1 year)
  DELETE FROM goal_progress_history 
  WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate weekly reflection prompts
CREATE OR REPLACE FUNCTION generate_weekly_reflection_prompts()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  week_start date;
  week_end date;
BEGIN
  week_start := date_trunc('week', CURRENT_DATE)::date;
  week_end := week_start + INTERVAL '6 days';
  
  -- Loop through active users
  FOR user_record IN 
    SELECT id, email FROM user_profiles 
    WHERE updated_at >= CURRENT_DATE - INTERVAL '14 days'
  LOOP
    -- Check if weekly reflection already exists
    IF NOT EXISTS (
      SELECT 1 FROM weekly_reflections 
      WHERE user_id = user_record.id AND week_start_date = week_start
    ) THEN
      -- Create weekly reflection template
      INSERT INTO weekly_reflections (
        user_id,
        week_start_date,
        week_end_date,
        biggest_wins,
        main_challenges,
        next_week_priorities
      ) VALUES (
        user_record.id,
        week_start,
        week_end,
        ARRAY['Add your biggest win this week'],
        ARRAY['What was your main challenge?'],
        ARRAY['What are your top 3 priorities for next week?']
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process notion sync queue
CREATE OR REPLACE FUNCTION process_notion_sync_queue()
RETURNS void AS $$
DECLARE
  queue_item RECORD;
  sync_log_id uuid;
BEGIN
  -- Process pending sync items (limit to 10 per run)
  FOR queue_item IN 
    SELECT * FROM notion_sync_queue 
    WHERE status = 'pending' 
      AND scheduled_for <= now()
      AND retry_count < max_retries
    ORDER BY priority DESC, created_at ASC
    LIMIT 10
  LOOP
    -- Update status to processing
    UPDATE notion_sync_queue 
    SET 
      status = 'processing',
      last_attempt_at = now(),
      updated_at = now()
    WHERE id = queue_item.id;
    
    -- Create sync log entry
    INSERT INTO notion_sync_logs (
      integration_id,
      sync_type,
      data_type,
      sync_direction,
      status,
      started_at
    ) VALUES (
      queue_item.integration_id,
      'manual',
      queue_item.data_type,
      'to_notion',
      'started',
      now()
    ) RETURNING id INTO sync_log_id;
    
    -- Here you would call the actual Notion API sync function
    -- For now, we'll simulate success/failure
    
    -- Simulate processing (in real implementation, this would be the actual sync)
    IF random() > 0.1 THEN -- 90% success rate simulation
      -- Mark as completed
      UPDATE notion_sync_queue 
      SET 
        status = 'completed',
        updated_at = now()
      WHERE id = queue_item.id;
      
      UPDATE notion_sync_logs 
      SET 
        status = 'completed',
        completed_at = now(),
        records_processed = 1,
        records_successful = 1
      WHERE id = sync_log_id;
    ELSE
      -- Mark as failed and increment retry count
      UPDATE notion_sync_queue 
      SET 
        status = 'failed',
        retry_count = retry_count + 1,
        error_message = 'Simulated sync failure',
        scheduled_for = now() + INTERVAL '1 hour', -- Retry in 1 hour
        updated_at = now()
      WHERE id = queue_item.id;
      
      UPDATE notion_sync_logs 
      SET 
        status = 'failed',
        completed_at = now(),
        error_details = jsonb_build_object('message', 'Simulated sync failure')
      WHERE id = sync_log_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-queue notion syncs
CREATE OR REPLACE FUNCTION auto_queue_notion_syncs()
RETURNS void AS $$
DECLARE
  integration_record RECORD;
BEGIN
  -- Loop through active integrations with auto-sync enabled
  FOR integration_record IN 
    SELECT * FROM notion_integrations 
    WHERE is_connected = true 
      AND sync_enabled = true
      AND connection_status = 'connected'
      AND (last_sync_at IS NULL OR last_sync_at < now() - INTERVAL '1 hour' * auto_sync_interval / 3600)
  LOOP
    -- Queue sync for goals if enabled
    IF (integration_record.sync_settings->>'sync_goals')::boolean THEN
      INSERT INTO notion_sync_queue (integration_id, data_type, record_id, operation, priority)
      SELECT integration_record.id, 'goals', g.id, 'update', 3
      FROM goals g
      WHERE g.user_id = (SELECT user_id FROM notion_integrations WHERE id = integration_record.id)
        AND g.updated_at > COALESCE(integration_record.last_sync_at, '1970-01-01'::timestamptz)
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Queue sync for habits if enabled
    IF (integration_record.sync_settings->>'sync_habits')::boolean THEN
      INSERT INTO notion_sync_queue (integration_id, data_type, record_id, operation, priority)
      SELECT integration_record.id, 'habits', h.id, 'update', 3
      FROM habits h
      WHERE h.user_id = (SELECT user_id FROM notion_integrations WHERE id = integration_record.id)
        AND h.updated_at > COALESCE(integration_record.last_sync_at, '1970-01-01'::timestamptz)
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Queue sync for insights if enabled
    IF (integration_record.sync_settings->>'sync_insights')::boolean THEN
      INSERT INTO notion_sync_queue (integration_id, data_type, record_id, operation, priority)
      SELECT integration_record.id, 'insights', li.id, 'create', 4
      FROM life_insights li
      WHERE li.user_id = (SELECT user_id FROM notion_integrations WHERE id = integration_record.id)
        AND li.created_at > COALESCE(integration_record.last_sync_at, '1970-01-01'::timestamptz)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;