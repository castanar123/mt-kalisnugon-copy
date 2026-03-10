import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, AlertTriangle, FileText, Activity, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function RangerDashboard() {
  const { user } = useAuth();
  const [zones, setZones] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [reportZone, setReportZone] = useState('');
  const [reportCondition, setReportCondition] = useState('good');
  const [reportDesc, setReportDesc] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [{ data: z }, { data: r }, { data: s }] = await Promise.all([
      supabase.from('trail_zones').select('*'),
      supabase.from('trail_reports').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('hiker_sessions').select('*').eq('status', 'active'),
    ]);
    setZones(z || []);
    setReports(r || []);
    setSessions(s || []);
  };

  const submitReport = async () => {
    if (!user || !reportZone) return;
    setLoading(true);
    const { error } = await supabase.from('trail_reports').insert({
      ranger_id: user.id,
      zone_id: reportZone,
      condition: reportCondition,
      description: reportDesc,
    });
    if (error) toast.error(error.message);
    else { toast.success('Trail report submitted!'); setReportDesc(''); loadData(); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">Ranger <span className="text-gradient">Dashboard</span></h1>
          <p className="text-muted-foreground mb-8">Monitor hikers, report trail conditions, and manage safety.</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <Activity className="h-10 w-10 text-sky opacity-60" />
              <div>
                <p className="text-xs text-muted-foreground">Active Hikers</p>
                <p className="text-3xl font-bold">{sessions.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <FileText className="h-10 w-10 text-primary opacity-60" />
              <div>
                <p className="text-xs text-muted-foreground">Reports Filed</p>
                <p className="text-3xl font-bold">{reports.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <Shield className="h-10 w-10 text-warning opacity-60" />
              <div>
                <p className="text-xs text-muted-foreground">Active Zones</p>
                <p className="text-3xl font-bold">{zones.filter((z: any) => z.status === 'active').length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Submit Report */}
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" /> Submit Trail Report</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Trail Zone</Label>
                <Select value={reportZone} onValueChange={setReportZone}>
                  <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                  <SelectContent>
                    {zones.map((z: any) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={reportCondition} onValueChange={setReportCondition}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="closed">Closed / Hazardous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} placeholder="Describe trail conditions..." />
              </div>
              <Button onClick={submitReport} disabled={loading || !reportZone} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Report
              </Button>
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg">Recent Trail Reports</CardTitle></CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No reports yet.</p>
              ) : (
                <div className="space-y-3">
                  {reports.map((r: any) => (
                    <div key={r.id} className="p-3 rounded-lg bg-secondary/30 border border-border/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          r.condition === 'good' ? 'bg-primary/20 text-primary' :
                          r.condition === 'moderate' ? 'bg-warning/20 text-warning' :
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {r.condition}
                        </span>
                        <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm">{r.description || 'No description'}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
