import { LayoutDashboard, Database, HardDrive } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';

export default function StatsGrid({ statusFilter, hasSearched, stats }) {
  return (
    <div className="grid-auto mb-10">
      <StatCard
        icon={<LayoutDashboard />}
        label={`Total ${statusFilter}`}
        value={hasSearched ? stats.total : '—'}
        color="var(--primary)"
        delay="0.2s"
      />
      <StatCard
        icon={<Database />}
        label="Gestión (Lista 1)"
        value={hasSearched ? stats.list1 : '—'}
        color="var(--secondary)"
        delay="0.3s"
      />
      <StatCard
        icon={<HardDrive />}
        label="Migración (Lista 2)"
        value={hasSearched ? stats.list2 : '—'}
        color="var(--accent)"
        delay="0.4s"
      />
    </div>
  );
}
