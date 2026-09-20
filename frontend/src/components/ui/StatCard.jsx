import React from 'react';

export default function StatCard({ icon, label, value, color, delay }) {
  return (
    <div className="glass glass-interactive stat-card animate-in" style={{ animationDelay: delay }}>
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-white-5 rounded-xl group-hover:scale-110 transition-all duration-300" style={{ color }}>
          {React.cloneElement(icon, { size: 24 })}
        </div>
      </div>
      <div className="text-text-dark text-[9px] font-bold uppercase tracking-[0.1em] mb-1">{label}</div>
      <div className="text-4xl font-extrabold text-white tracking-tighter tabular-nums">{value}</div>
    </div>
  );
}
