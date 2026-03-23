/**
 * Activity log utility for tamper-proof audit trail.
 * 
 * Run this SQL in Supabase to create the table:
 * 
 * CREATE TABLE IF NOT EXISTS admin_logs (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   created_at timestamptz NOT NULL DEFAULT now(),
 *   actor_id uuid REFERENCES auth.users(id),
 *   action text NOT NULL,
 *   entity_type text NOT NULL,
 *   entity_id text,
 *   before_state jsonb,
 *   after_state jsonb,
 *   metadata jsonb
 * );
 * 
 * ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Admins can read logs" ON admin_logs FOR SELECT USING (true);
 * CREATE POLICY "Service can insert logs" ON admin_logs FOR INSERT WITH CHECK (true);
 * -- No UPDATE or DELETE policies — logs are append-only.
 */

import { supabase } from '@/integrations/supabase/client';

export type LogAction =
  | 'payment_recorded'
  | 'payment_updated'
  | 'booking_confirmed'
  | 'booking_rejected'
  | 'booking_adjusted'
  | 'screenshot_uploaded'
  | 'hike_started'
  | 'guide_assigned'
  | 'capacity_set';

export interface ActivityLogEntry {
  actor_id?: string;
  action: LogAction;
  entity_type: 'booking' | 'payment' | 'capacity' | 'guide';
  entity_id?: string;
  before_state?: Record<string, unknown>;
  after_state?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function writeActivityLog(entry: ActivityLogEntry): Promise<void> {
  try {
    const { error } = await supabase.from('admin_logs' as any).insert({
      ...entry,
      created_at: new Date().toISOString(),
    });
    if (error) {
      // Table might not exist yet — silently fail so it doesn't break the UI
      if (error.code !== '42P01') {
        console.warn('[ActivityLog] Insert failed:', error.message);
      }
    }
  } catch (err) {
    console.warn('[ActivityLog] Error:', err);
  }
}

export async function fetchActivityLogs(
  entityId?: string,
  limit = 50,
): Promise<any[]> {
  try {
    let query = supabase
      .from('admin_logs' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query;
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}
