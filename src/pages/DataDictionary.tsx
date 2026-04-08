import { motion } from 'framer-motion';
import { DATA_DICTIONARY } from '@/data/engine/dataDictionary';
import { useWorld } from '@/contexts/WorldContext';
import { getSummaryStats } from '@/data/engine/aggregations';
import WorldSwitcher from '@/components/WorldSwitcher';
import TrustBadge from '@/components/TrustBadge';
import SuppressionBadge from '@/components/SuppressionBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Table, ShieldCheck, Eye, Brain, AlertTriangle } from 'lucide-react';

export default function DataDictionary() {
  const { dataset, loading } = useWorld();

  if (loading || !dataset) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading world data…</p>
        </div>
      </div>
    );
  }

  const stats = getSummaryStats(dataset);

  const statCards = [
    stats.totalPatients,
    stats.totalEvents,
    stats.totalProviders,
    stats.avgComorbidity,
    stats.discontinueRate,
    stats.avgPdc,
    stats.avgTimeToStart,
    stats.denialRate,
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-12 space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Data Dictionary</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Every dataset and field used in RWE Studio. All data is synthetic. No PHI. No real provider NPIs. Only aggregated outputs are shown in the UI.
            </p>
          </div>
          <WorldSwitcher />
        </div>

        {/* Trust legend */}
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-700">Observed</span>
            <span className="text-muted-foreground">Directly computed from events</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-purple-700">Inferred</span>
            <span className="text-muted-foreground">Derived using rules</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="font-medium text-orange-700">Suppressed</span>
            <span className="text-muted-foreground">Count below 11</span>
          </div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          World Summary: {dataset.meta.label}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((metric) => (
            <Card key={metric.label} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <p className="text-xl font-bold text-foreground">
                      {metric.suppressed ? (
                        <SuppressionBadge count={metric.count} />
                      ) : (
                        metric.value < 1 && metric.value > 0
                          ? `${(metric.value * 100).toFixed(1)}%`
                          : metric.value.toLocaleString()
                      )}
                    </p>
                  </div>
                  <TrustBadge trust={metric.trust} size="sm" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Dataset Tables */}
      {DATA_DICTIONARY.map((ds, idx) => (
        <motion.div
          key={ds.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + idx * 0.05 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Table className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{ds.name}</CardTitle>
                  <CardDescription>{ds.description}</CardDescription>
                </div>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {ds.recordCount}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Field</th>
                      <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Type</th>
                      <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Description</th>
                      <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Example</th>
                      <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Trust</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ds.fields.map((f) => (
                      <tr key={f.field} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                        <td className="py-2 px-3 font-mono text-xs text-foreground">{f.field}</td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className="text-[10px] font-mono">{f.type}</Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground max-w-xs">{f.description}</td>
                        <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{f.example}</td>
                        <td className="py-2 px-3">
                          <TrustBadge
                            trust={{
                              kind: f.trustKind,
                              confidence: f.trustKind === 'observed' ? 90 : 70,
                              reason: f.trustKind === 'observed'
                                ? 'Directly recorded in the source data.'
                                : 'Derived through rules or statistical models.',
                            }}
                            size="sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Privacy notice */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
        <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Privacy and compliance</p>
          <p>All data in this portfolio is synthetic. No protected health information is used. Provider IDs are fictional 10 digit numbers that do not correspond to real NPIs. Patient level records are never displayed. Any chart cell with fewer than 11 records is automatically suppressed.</p>
        </div>
      </div>
    </div>
  );
}
