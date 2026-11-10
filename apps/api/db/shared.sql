-- Shared Platform tables
-- Requires pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    full_name TEXT,
    username TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspaces (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name TEXT NOT NULL,
	slug TEXT UNIQUE NOT NULL,
	created_at TIMESTAMPTZ DEFAULT now(),
	updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_members (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	user_id TEXT NOT NULL,
	role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
	joined_at TIMESTAMPTZ DEFAULT now(),
	UNIQUE (workspace_id, user_id)
);

-- audit log table and notification table (added on 04-04-2026)
CREATE TABLE IF NOT EXISTS audit_events (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	actor_id TEXT NOT NULL,
	entity_type TEXT NOT NULL,
	entity_id UUID NOT NULL,
	action TEXT NOT NULL,
	old_values JSONB,
	new_values JSONB,
	created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_workspace_entity_created
	ON audit_events (workspace_id, entity_type, created_at);

CREATE TABLE IF NOT EXISTS notifications (
	id UUID PRIMARY KEY,
	workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	recipient_id TEXT NOT NULL,
	type TEXT NOT NULL,
	title TEXT NOT NULL,
	message TEXT,
	entity_type TEXT,
	entity_id UUID,
	is_read BOOLEAN DEFAULT false,
	created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_workspace_recipient_read
	ON notifications (workspace_id, recipient_id, is_read);

