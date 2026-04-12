const CONFIG = {
  Eligible:  { cls: 'badge badge-eligible',  dot: '#10b981' },
  Approved:  { cls: 'badge badge-approved',  dot: '#3b82f6' },
  Rejected:  { cls: 'badge badge-rejected',  dot: '#ef4444' },
  Pending:   { cls: 'badge badge-pending',   dot: '#f59e0b' },
  Completed: { cls: 'badge badge-completed', dot: '#10b981' },
}

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || { cls: 'badge badge-pending', dot: '#94a3b8' }
  return (
    <span className={cfg.cls}>
      <span
        style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }}
      />
      {status}
    </span>
  )
}
