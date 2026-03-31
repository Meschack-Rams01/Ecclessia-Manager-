import { createClient } from '@supabase/supabase-js'

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://jrsialpxoeqbrevfslky.supabase.co'
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE'

if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ ERREUR: Vous devez entrer votre SERVICE_ROLE_KEY dans le script ou en ligne de commande.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function migrate() {
  console.log('🚀 Démarrage de la migration...')

  // Note: Standard Supabase client doesn't support raw SQL (DDL). 
  // You must run these in the Dashboard SQL Editor.
  
  const sql = `
  ALTER TABLE extensions ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '123456';
  UPDATE extensions SET password = data->>'password' WHERE password IS NULL;
  ALTER TABLE extensions ALTER COLUMN password SET DEFAULT '123456';
  `

  console.log('--- COPIEZ CE CODE DANS LE SQL EDITOR DEv SUPABASE ---')
  console.log(sql)
  console.log('----------------------------------------------------')
  
  console.log('\n💡 Une fois exécuté, le système fonctionnera parfaitement.')
}

migrate()
