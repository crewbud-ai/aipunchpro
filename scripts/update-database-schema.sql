-- Add role-based permissions and hierarchy
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Create user_roles table for more granular role management
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- Add role_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES user_roles(id);

-- Create project_permissions table for project-specific access
CREATE TABLE IF NOT EXISTS project_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  can_manage BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Add blueprint support
CREATE TABLE IF NOT EXISTS blueprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  version VARCHAR(50),
  description TEXT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_current BOOLEAN DEFAULT true
);

-- Add AI analysis results table
CREATE TABLE IF NOT EXISTS ai_analysis_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL, -- 'material_list', 'schedule_suggestion', 'punchlist'
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add material items table for tracking needed items
CREATE TABLE IF NOT EXISTS material_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity INTEGER DEFAULT 1,
  unit VARCHAR(50),
  status VARCHAR(50) DEFAULT 'needed', -- needed, ordered, received
  identified_by VARCHAR(50) DEFAULT 'manual', -- manual, ai
  ai_analysis_id UUID REFERENCES ai_analysis_results(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update RLS policies
CREATE POLICY "Users can view assigned projects" ON projects FOR SELECT USING (
  id IN (
    SELECT project_id FROM project_permissions WHERE user_id = auth.uid() AND can_view = true
  ) OR 
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can view assigned blueprints" ON blueprints FOR SELECT USING (
  project_id IN (
    SELECT project_id FROM project_permissions WHERE user_id = auth.uid() AND can_view = true
  ) OR 
  project_id IN (
    SELECT id FROM projects WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
);
