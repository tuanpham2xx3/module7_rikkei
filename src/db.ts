import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
@Injectable()
export class Database implements OnModuleDestroy {
  private pool = new Pool({ connectionString: process.env.DATABASE_URL });
  async owner<T>(id: string, action: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.user_id',$1,true)", [id]);
      await client.query('INSERT INTO users(id) VALUES($1) ON CONFLICT DO NOTHING', [id]);
      await client.query('INSERT INTO profiles(user_id) VALUES($1) ON CONFLICT DO NOTHING', [id]);
      const result = await action(client);
      await client.query('COMMIT');
      return result;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  async onModuleDestroy() { await this.pool.end(); }
}
