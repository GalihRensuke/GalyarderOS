/*
  # Notion Integration Schema

  1. New Tables
    - `notion_integrations`
      - Store Notion workspace connection details
      - Database mappings and sync settings
    
    - `notion_sync_logs`
      - Track synchronization history and status
      - Error logging and retry mechanisms
    
    - `notion_database_mappings`
      - Map GalyarderOS data types to Notion databases
      - Store database IDs and property mappings

  2. Security
    - Enable RLS on all tables
    - Users can only access their own integration data
    - Encrypted storage for sensitive tokens
*/

-- Notion Integrations Table
CREATE TABLE IF NOT EXISTS notion_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  workspace_id text,
  workspace_name text,
  integration_token_hash text, -- Store hashed token for security
  is_connected boolean DEFAULT false,
  connection_status text DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error', 'expired')),
  last_sync_at timestamptz,
  sync_enabled boolean DEFAULT true,
  auto_sync_interval integer DEFAULT 3600, -- seconds
  sync_settings jsonb DEFAULT '{
    "sync_goals": true,
    "sync_habits": true,
    "sync_insights": true,
    "sync_reflections": true,
    "sync_sessions": false,
    "create_missing_databases": true,
    "update_existing_entries": true
  }'::jsonb,
  error_message text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Notion Database Mappings Table
CREATE TABLE IF NOT EXISTS notion_database_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES notion_integrations(id) ON DELETE CASCADE NOT NULL,
  data_type text NOT NULL CHECK (data_type IN ('goals', 'habits', 'insights', 'reflections', 'sessions', 'tasks')),
  notion_database_id text NOT NULL,
  database_name text,
  property_mappings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  sync_direction text DEFAULT 'bidirectional' CHECK (sync_direction IN ('to_notion', 'from_notion', 'bidirectional')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(integration_id, data_type)
);

-- Notion Sync Logs Table
CREATE TABLE IF NOT EXISTS notion_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES notion_integrations(id) ON DELETE CASCADE NOT NULL,
  sync_type text NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual', 'scheduled')),
  data_type text CHECK (data_type IN ('goals', 'habits', 'insights', 'reflections', 'sessions', 'all')),
  sync_direction text NOT NULL CHECK (sync_direction IN ('to_notion', 'from_notion', 'bidirectional')),
  status text NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed', 'cancelled')),
  records_processed integer DEFAULT 0,
  records_successful integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_details jsonb,
  sync_duration_ms integer,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Notion Sync Queue Table
CREATE TABLE IF NOT EXISTS notion_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES notion_integrations(id) ON DELETE CASCADE NOT NULL,
  data_type text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  scheduled_for timestamptz DEFAULT now(),
  last_attempt_at timestamptz,
  error_message text,
  payload jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE notion_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_database_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_sync_queue ENABLE ROW LEVEL SECURITY;

-- Policies for notion_integrations
CREATE POLICY "Users can manage own notion integrations"
  ON notion_integrations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for notion_database_mappings
CREATE POLICY "Users can manage own database mappings"
  ON notion_database_mappings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notion_integrations 
      WHERE notion_integrations.id = notion_database_mappings.integration_id 
      AND notion_integrations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notion_integrations 
      WHERE notion_integrations.id = notion_database_mappings.integration_id 
      AND notion_integrations.user_id = auth.uid()
    )
  );

-- Policies for notion_sync_logs
CREATE POLICY "Users can view own sync logs"
  ON notion_sync_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notion_integrations 
      WHERE notion_integrations.id = notion_sync_logs.integration_id 
      AND notion_integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage sync logs"
  ON notion_sync_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notion_integrations 
      WHERE notion_integrations.id = notion_sync_logs.integration_id 
      AND notion_integrations.user_id = auth.uid()
    )
  );

-- Policies for notion_sync_queue
CREATE POLICY "Users can view own sync queue"
  ON notion_sync_queue
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notion_integrations 
      WHERE notion_integrations.id = notion_sync_queue.integration_id 
      AND notion_integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage sync queue"
  ON notion_sync_queue
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notion_integrations 
      WHERE notion_integrations.id = notion_sync_queue.integration_id 
      AND notion_integrations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notion_integrations 
      WHERE notion_integrations.id = notion_sync_queue.integration_id 
      AND notion_integrations.user_id = auth.uid()
    )
  );

-- Function to queue sync operations
CREATE OR REPLACE FUNCTION queue_notion_sync(
  p_integration_id uuid,
  p_data_type text,
  p_record_id uuid,
  p_operation text,
  p_priority integer DEFAULT 5,
  p_payload jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  queue_id uuid;
BEGIN
  INSERT INTO notion_sync_queue (
    integration_id,
    data_type,
    record_id,
    operation,
    priority,
    payload
  ) VALUES (
    p_integration_id,
    p_data_type,
    p_record_id,
    p_operation,
    p_priority,
    p_payload
  ) RETURNING id INTO queue_id;
  
  RETURN queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update sync status
CREATE OR REPLACE FUNCTION update_notion_sync_status()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Update integration last sync time on successful completion
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE notion_integrations 
    SET 
      last_sync_at = now(),
      connection_status = 'connected',
      error_message = NULL,
      retry_count = 0
    WHERE id = NEW.integration_id;
  END IF;
  
  -- Update error status on failure
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    UPDATE notion_integrations 
    SET 
      connection_status = 'error',
      error_message = NEW.error_details->>'message',
      retry_count = retry_count + 1
    WHERE id = NEW.integration_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for sync status updates
CREATE TRIGGER update_notion_sync_status_trigger
  BEFORE UPDATE ON notion_sync_logs
  FOR EACH ROW EXECUTE FUNCTION update_notion_sync_status();

-- Triggers for updated_at
CREATE TRIGGER update_notion_integrations_updated_at
  BEFORE UPDATE ON notion_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notion_database_mappings_updated_at
  BEFORE UPDATE ON notion_database_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notion_sync_queue_updated_at
  BEFORE UPDATE ON notion_sync_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();