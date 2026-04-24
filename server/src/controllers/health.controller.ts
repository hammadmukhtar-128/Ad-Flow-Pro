import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/db/connect';

export async function healthCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const start = Date.now();
    const { error } = await supabase.from('users').select('count').limit(1);
    const dbLatencyMs = Date.now() - start;

    const status = error ? 'degraded' : 'healthy';

    // Log to system_health_logs
    if (!error) {
      await supabase.from('system_health_logs').insert({
        id: uuidv4(),
        status,
        db_latency_ms: dbLatencyMs,
        checked_at: new Date().toISOString(),
      });
    }

    res.json({
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      db: {
        connected: !error,
        latency_ms: dbLatencyMs,
      },
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
    });
  }
}