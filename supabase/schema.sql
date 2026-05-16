-- Create Accounts Table (One per signing up parent)
CREATE TABLE IF NOT EXISTS public.accounts (
    id uuid references auth.users not null primary key, -- The parent's Auth ID is their Account ID
    stripe_customer_id text,
    app_name text default 'Jaxon Academy',
    logo_url text default '',
    brand_color_primary text default 'hsl(224, 76%, 58%)',
    custom_domain text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on accounts
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own account" 
    ON public.accounts FOR SELECT 
    USING (auth.uid() = id);

-- Create Profiles Table (Students, Teachers, and the Principal)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid default gen_random_uuid() primary key,
    account_id uuid references public.accounts(id) not null,
    name text not null,
    role text not null check (role in ('student', 'teacher', 'principal')),
    grade_level text,
    avatar_url text,
    theme_color text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view profiles in their account" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = account_id);

CREATE POLICY "Users can insert profiles in their account" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can update profiles in their account" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = account_id);

CREATE POLICY "Users can delete profiles in their account" 
    ON public.profiles FOR DELETE 
    USING (auth.uid() = account_id);

-- Create Subscriptions Table (Synced via Stripe Webhooks)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id text primary key, -- Stripe Subscription ID
    account_id uuid references public.accounts(id) not null,
    status text not null,
    price_id text,
    current_period_end timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" 
    ON public.subscriptions FOR SELECT 
    USING (auth.uid() = account_id);

-- Setup an Auth Trigger to automatically create an 'account' when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.accounts (id)
  VALUES (new.id);
  
  -- Automatically create the "Principal" profile for the new user
  INSERT INTO public.profiles (account_id, name, role, avatar_url, theme_color)
  VALUES (new.id, 'Principal', 'principal', 'https://api.dicebear.com/9.x/bottts/svg?seed=' || new.id, 'hsl(224, 76%, 58%)');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
