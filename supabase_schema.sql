-- 1. Create the orders table
CREATE TABLE public.orders (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    stage TEXT NOT NULL,
    system TEXT NOT NULL,
    priority TEXT NOT NULL,
    assignee TEXT NOT NULL,
    "checklistState" JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
-- Supabase requires this to be turned on for security.
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 3. Create a development policy 
-- This policy allows full read/write access without a login. 
-- IMPORTANT: Once you build authentication, you should restrict this!
CREATE POLICY "Enable full access for all users" ON public.orders
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. Enable Realtime Broadcasts
-- This specific command tells Supabase to send WebSocket events when data changes,
-- powering the live drag-and-drop updates across different computers.
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
