export default function StatCard({ label, value, icon: Icon, color = 'blue', sub }) {
  const colorMap = {
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-500',   text: 'text-blue-600' },
    orange: { bg: 'bg-orange-50', icon: 'bg-[#e37412]',  text: 'text-[#e37412]' },
    green:  { bg: 'bg-emerald-50',icon: 'bg-emerald-500', text: 'text-emerald-600' },
    amber:  { bg: 'bg-amber-50',  icon: 'bg-amber-500',   text: 'text-amber-600' },
    red:    { bg: 'bg-red-50',    icon: 'bg-red-500',     text: 'text-red-600' },
    indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-500',  text: 'text-indigo-600' },
    maroon: { bg: 'bg-rose-50',   icon: 'bg-rose-700',    text: 'text-rose-700' },
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div className="stat-card fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-extrabold text-slate-800 leading-none">{value ?? '—'}</p>
          {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
        </div>
        {Icon && (
          <div className={`${c.icon} w-11 h-11 rounded-xl flex items-center justify-center shadow-sm`}>
            <Icon size={22} color="white" />
          </div>
        )}
      </div>
    </div>
  )
}
