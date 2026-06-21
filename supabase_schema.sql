-- 1. Create the companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    stage TEXT NOT NULL,
    system TEXT NOT NULL,
    priority TEXT NOT NULL,
    assignee TEXT NOT NULL,
    "checklistState" JSONB NOT NULL DEFAULT '{}'::jsonb,
    company_name TEXT NOT NULL DEFAULT 'DEFAULT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.1 Safely add company_name if the orders table already existed before this update
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL DEFAULT 'DEFAULT';

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. Create development policies 
-- (Drops existing policies first to prevent "policy already exists" errors)
DROP POLICY IF EXISTS "Enable full access for companies" ON public.companies;
CREATE POLICY "Enable full access for companies" ON public.companies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable full access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable full access for orders" ON public.orders;
CREATE POLICY "Enable full access for orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- 5. Enable Realtime Broadcasts
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
