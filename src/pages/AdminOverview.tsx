import { Link } from 'react-router-dom';
import { ClipboardCheck, MousePointerClick, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSeo } from '@/hooks/useSeo';

export default function AdminOverview() {
  useSeo({ title: 'Admin workspace | Clinical Trial Diversity Studio', canonical: '/admin', noindex: true });
  return <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 grid sm:grid-cols-2 gap-4">
    <section className="ctg-panel p-5"><ClipboardCheck className="text-primary h-6 w-6 mb-3" /><h2 className="text-lg mb-4">Search evaluation</h2><Button asChild><Link to="/analytics/search-eval">Open search evaluation</Link></Button></section>
    <section className="ctg-panel p-5"><MousePointerClick className="text-primary h-6 w-6 mb-3" /><h2 className="text-lg mb-4">Interaction analytics</h2><Button asChild><Link to="/analytics/heatmap">Open analytics</Link></Button></section>
    <section className="ctg-panel p-5"><Flag className="text-primary h-6 w-6 mb-3" /><h2 className="text-lg mb-4">Issue reports</h2><Button asChild><Link to="/admin/issues">Open issue reports</Link></Button></section>
  </div>;
}