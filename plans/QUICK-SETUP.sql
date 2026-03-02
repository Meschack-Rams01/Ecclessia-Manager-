-- ============================================
-- COMPLETE SUPABASE SETUP FOR CHURCHREPORT
-- Run this in SQL Editor to fix 401 errors
-- ============================================

-- Step 1: Create extensions table
CREATE TABLE IF NOT EXISTS extensions (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create rapports table  
CREATE TABLE IF NOT EXISTS rapports (
  id TEXT PRIMARY KEY,
  extension_id TEXT NOT NULL,
  date DATE NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'app_settings',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_rapports_extension ON rapports(extension_id);
CREATE INDEX IF NOT EXISTS idx_rapports_date ON rapports(date DESC);

-- Step 5: DISABLE RLS (for development only)
ALTER TABLE extensions DISABLE ROW LEVEL SECURITY;
ALTER TABLE rapports DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Step 6: Insert sample data with passwords
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
  "password": "nicosie123",
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
  "password": "limassol123",
  "devise": "EUR",
  "symbole": "€"
}'::jsonb),

('ext_lar', '{
  "id": "ext_lar",
  "nom": "Larnaca Est",
  "couleur": "#DC2626",
  "ville": "Larnaca",
  "pays": "Chypre",
  "adresse": "8 Boulevard du Lac, Larnaca",
  "dateCreation": "2020-01-10",
  "pasteur": {
    "nom": "Pasteur Daniel Nzamba",
    "email": "d.nzamba@eic.cy",
    "tel": "+357 99 789 012"
  },
  "coordinateur": "Frère Caleb Mbombo",
  "secretaire": "Sœur Miriam Kavula",
  "tresorier": "Frère Thomas Luzolo",
  "password": "larnaca123",
  "devise": "EUR",
  "symbole": "€"
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Verify tables were created
SELECT 'extensions' as table_name, count(*) as row_count FROM extensions
UNION ALL
SELECT 'rapports', count(*) FROM rapports
UNION ALL  
SELECT 'settings', count(*) FROM settings;
