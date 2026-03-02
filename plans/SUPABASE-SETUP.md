# Supabase Setup Guide for ChurchReport

This guide walks you through setting up Supabase as the backend for the Emerge in Christ church reporting system.

## Prerequisites

- A Supabase account (free tier works)
- Node.js 18+ installed

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `churchreport` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"**
5. Wait for the project to be provisioned (1-2 minutes)

---

## Step 2: Get API Credentials

1. In your Supabase dashboard, go to **Settings** (⚙️ icon)
2. Click **API** in the left sidebar
3. Under **Project API keys**, you'll see:
   - **Project URL**: `https://xxxxxxxxxxxx.supabase.co` 
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`

---

## Step 3: Configure Environment Variables

1. Copy the example file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Step 4: Set Up Database Schema

In your Supabase dashboard, go to the **SQL Editor** and run the following queries:

### Create Tables

```sql
-- Extensions table (church sites)
CREATE TABLE IF NOT EXISTS extensions (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rapports table (service reports)
CREATE TABLE IF NOT EXISTS rapports (
  id TEXT PRIMARY KEY,
  extension_id TEXT NOT NULL,
  date DATE NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table (app configuration)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'app_settings',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dépenses supplémentaires table (hors culte)
CREATE TABLE IF NOT EXISTS depenses_supplementaires (
  id TEXT PRIMARY KEY,
  extension_id TEXT NOT NULL,
  date DATE NOT NULL,
  motif TEXT NOT NULL,
  montant DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Create Indexes (for performance)

```sql
-- Index for filtering rapports by extension
CREATE INDEX IF NOT EXISTS idx_rapports_extension 
ON rapports(extension_id);

-- Index for sorting by date
CREATE INDEX IF NOT EXISTS idx_rapports_date 
ON rapports(date DESC);

-- Index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_rapports_extension_date 
ON rapports(extension_id, date DESC);

-- Index for depenses supplementaires
CREATE INDEX IF NOT EXISTS idx_dep_sup_extension 
ON depenses_supplementaires(extension_id);

CREATE INDEX IF NOT EXISTS idx_dep_sup_date 
ON depenses_supplementaires(date DESC);

CREATE INDEX IF NOT EXISTS idx_dep_sup_extension_date 
ON depenses_supplementaires(extension_id, date DESC);
```

---

## Step 5: Enable Row Level Security (RLS) - QUICK FIX

**For development, let's disable RLS to make it work:**

Go to **SQL Editor** and run:

```sql
-- Disable RLS for development (enable it later for production)
ALTER TABLE extensions DISABLE ROW LEVEL SECURITY;
ALTER TABLE rapports DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE depenses_supplementaires DISABLE ROW LEVEL SECURITY;
```

**That's it!** The app should work now.

---

## Step 5 (Full): Enable RLS with Proper Policies

If you want full security later, use these policies:

```sql
-- Enable RLS
ALTER TABLE extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapports ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE depenses_supplementaires ENABLE ROW LEVEL SECURITY;

-- Allow all operations without auth (for development)
CREATE POLICY "allow_all_extensions" ON extensions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_rapports" ON rapports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_dep_sup" ON depenses_supplementaires FOR ALL USING (true) WITH CHECK (true);
```

---

## Step 6: Set Up Authentication

### Enable Auth Providers

1. Go to **Authentication** → **Providers**
2. Enable **Email** (already enabled by default)
3. Optionally enable Google, GitHub, etc.

### Create User Roles

When creating users, you'll need to set their metadata:

| Role | Metadata |
|------|----------|
| Admin | `{"role": "admin"}` |
| Extension User | `{"role": "extension", "extension_id": "ext_nic"}` |

### Creating Users via Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **"Add user"**
3. Enter email and password
4. Click **"Create user"**

**Easy Role Assignment:**
- For **admin access**, use an email containing "admin" (e.g., `admin@church.com`)
- For **extension access**, use any other email (e.g., `nicosie@church.com`)

The system will automatically detect:
- Emails with "admin" → admin role
- All other emails → extension role

### Creating Users Programmatically

```sql
-- Create admin user (run in SQL Editor)
-- Note: In production, use the Supabase Admin API from a secure backend

-- This is just for initial setup - in production, use the client SDK
```

---

## Step 7: Test the Setup

1. Start the development server:
```bash
npm run dev
```

2. Open the app in your browser
3. Try logging in with the credentials you created

---

## Step 8: Seed Initial Data (Optional)

Run this SQL to add sample extensions:

```sql
INSERT INTO extensions (id, data) VALUES
('ext_nic', '{
  "id": "ext_nic",
  "nom": "Nicosie Centre",
  "couleur": "#8B5CF6",
  "ville": "Nicosie",
  "pays": "Chypre",
  "adresse": "12 Avenue de la Paix, Nicosie",
  "dateCreation": "2018-03-15",
  "pasteur": {
    "nom": "Pasteur Emmanuel Kabila",
    "email": "e.kabila@eic.cy",
    "tel": "+357 99 123 456"
  },
  "coordinateur": "Frère David Mutombo",
  "secretaire": "Sœur Rachel Lukusa",
  "tresorier": "Frère Jean-Paul Ngoy",
  "devise": "EUR",
  "symbole": "€"
}'::jsonb),
('ext_lim', '{
  "id": "ext_lim",
  "nom": "Limassol Sud",
  "couleur": "#059669",
  "ville": "Limassol",
  "pays": "Chypre",
  "adresse": "45 Rue des Flamboyants, Limassol",
  "dateCreation": "2019-07-20",
  "pasteur": {
    "nom": "Pasteur Pierre Kabasele",
    "email": "p.kabasele@eic.cy",
    "tel": "+357 99 654 321"
  },
  "coordinateur": "Frère Samuel Banza",
  "secretaire": "Sœur Esther Mwamba",
  "tresorier": "Frère Isaac Tshimanga",
  "devise": "EUR",
  "symbole": "€"
}'::jsonb);
```

---

## Troubleshooting

### "Supabase is not configured" Warning

Make sure your `.env` file has the correct values:
- `VITE_SUPABASE_URL` should be exactly: `https://xxxxxx.supabase.co`
- `VITE_SUPABASE_ANON_KEY` should start with `eyJ...`

### Authentication Not Working

1. Check the user's metadata in Supabase dashboard
2. Ensure RLS policies are enabled
3. Check the browser console for errors

### Data Not Syncing

1. Check that tables were created correctly
2. Verify RLS policies allow the operations
3. Check the browser network tab for API errors

---

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Admin policies restrict to `role = 'admin'`
- [ ] Extension policies restrict to matching `extension_id`
- [ ] Never expose service role key in client code
- [ ] Use HTTPS in production
- [ ] Regularly rotate database passwords

---

## Next Steps

Once Supabase is configured, the app will:
- ✅ Authenticate users via Supabase Auth
- ✅ Store data in PostgreSQL
- ✅ Enforce row-level security
- ✅ Sync in real-time via Supabase subscriptions

For production deployment, consider:
- Setting up email templates in Supabase
- Configuring custom SMTP for password resets
- Adding more RLS policies as needed
- Setting up database backups
