require('dotenv/config');
const {Pool}=require('pg');
const {readFileSync,readdirSync}=require('node:fs');
async function main(){
 const pool=new Pool({connectionString:process.env.DATABASE_URL}); const db=await pool.connect();
 try {
  await db.query('BEGIN');
  await db.query('SELECT pg_advisory_xact_lock(71001)');
  await db.query('CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz DEFAULT now())');
  for(const name of readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort()){
   if((await db.query('SELECT 1 FROM schema_migrations WHERE name=$1',[name])).rowCount) continue;
   await db.query(readFileSync(`migrations/${name}`,'utf8'));
   await db.query('INSERT INTO schema_migrations(name) VALUES($1)',[name]); console.log(`Applied ${name}`);
  }
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();await pool.end();}
}
main().catch(()=>{console.error('Migration failed; check database connection and migration SQL.');process.exitCode=1;});
