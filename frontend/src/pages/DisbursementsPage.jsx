import { useEffect, useState } from 'react'
import { Plus, X, ChevronDown } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import TopHeader from '../components/TopHeader'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosClient'
import toast from 'react-hot-toast'

const STAGES = ['Full Amount', 'First Installment', 'Second Installment']

export default function DisbursementsPage() {
  const { isAdmin } = useAuth()
  const [disbursements, setDisbursements] = useState([])
  const [eligibleApps, setEligibleApps]   = useState([])
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)

  const [form, setForm] = useState({
    application_id: '',
    amount: '',
    stage: 'Full Amount',
    payment_status: 'Pending',
  })
  const [submitting, setSubmitting] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      const disbRes = await api.get('/disbursements/')
      setDisbursements(disbRes.data)
      if (isAdmin) {
        const appsRes = await api.get('/applications/')
        setEligibleApps(
          appsRes.data.filter((a) => a.status === 'Approved' || a.status === 'Eligible')
        )
      }
    } catch {
      toast.error('Failed to load disbursements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [isAdmin])

  // Auto-fill amount from selected application's scholarship
  function handleAppChange(e) {
    const appId = Number(e.target.value)
    const found = eligibleApps.find((a) => a.application_id === appId)
    setForm((f) => ({
      ...f,
      application_id: appId,
      amount: found ? (form.stage === 'Full Amount' ? found.scholarship?.amount : found.scholarship?.amount / 2) : '',
    }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    try {
      setSubmitting(true)
      await api.post('/disbursements/', {
        application_id: Number(form.application_id),
        amount: Number(form.amount),
        stage: form.stage,
        payment_status: form.payment_status,
      })
      toast.success('Disbursement created successfully')
      setShowForm(false)
      setForm({ application_id: '', amount: '', stage: 'Full Amount', payment_status: 'Pending' })
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create disbursement')
    } finally {
      setSubmitting(false)
    }
  }

  async function markCompleted(id) {
    try {
      await api.patch(`/disbursements/${id}`, { payment_status: 'Completed' })
      toast.success('Marked as Completed')
      loadData()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const columns = [
    {
      key: 'application',
      label: 'Student / Scholarship',
      render: (_, row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.application?.student?.name ?? '—'}</p>
          <p className="text-xs text-slate-400">{row.application?.scholarship?.scholarship_name}</p>
        </div>
      ),
    },
    isAdmin && {
      key: 'dept',
      label: 'Dept',
      render: (_, row) => (
        <span className="text-sm text-slate-500">{row.application?.student?.department}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount (₹)',
      render: (v) => <span className="font-bold text-slate-800">₹{v?.toLocaleString('en-IN')}</span>,
    },
    { key: 'stage', label: 'Stage', render: (v) => <span className="text-sm">{v}</span> },
    {
      key: 'disbursement_date',
      label: 'Date',
      render: (v) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      key: 'payment_status',
      label: 'Payment',
      render: (v) => <StatusBadge status={v} />,
    },
    isAdmin && {
      key: 'actions',
      label: '',
      render: (_, row) =>
        row.payment_status === 'Pending' ? (
          <button onClick={() => markCompleted(row.disbursement_id)} className="btn-success text-xs py-1.5 px-3">
            Mark Paid
          </button>
        ) : null,
    },
  ].filter(Boolean)

  const totalDisbursed = disbursements
    .filter((d) => d.payment_status === 'Completed')
    .reduce((sum, d) => sum + d.amount, 0)

  const totalPending = disbursements
    .filter((d) => d.payment_status === 'Pending')
    .reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <TopHeader
          title="Disbursements"
          subtitle={isAdmin ? 'Track and manage all scholarship payments' : 'Your scholarship disbursement history'}
        />
        <main className="content-area">
          {/* Summary cards */}
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5 fade-in">
              <div className="stat-card">
                <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Total Records</p>
                <p className="text-3xl font-extrabold text-slate-800">{disbursements.length}</p>
              </div>
              <div className="stat-card">
                <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Disbursed</p>
                <p className="text-2xl font-extrabold text-emerald-600">₹{totalDisbursed.toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-400 mt-1">Payment Completed</p>
              </div>
              <div className="stat-card">
                <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Pending</p>
                <p className="text-2xl font-extrabold text-amber-500">₹{totalPending.toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-400 mt-1">Awaiting transfer</p>
              </div>
            </div>
          )}

          {/* Create disbursement form (admin) */}
          {isAdmin && (
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowForm(!showForm)} className="btn-primary" id="create-disbursement-btn">
                {showForm ? <><X size={15} />Cancel</> : <><Plus size={15} />New Disbursement</>}
              </button>
            </div>
          )}

          {isAdmin && showForm && (
            <div className="card p-6 mb-5 fade-in">
              <h3 className="font-bold text-slate-800 text-lg mb-4">Create Disbursement</h3>
              <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="form-label">Application (Approved/Eligible)</label>
                  <div className="relative">
                    <select value={form.application_id} onChange={handleAppChange} className="form-input appearance-none pr-9" required>
                      <option value="">— Select application —</option>
                      {eligibleApps.map((a) => (
                        <option key={a.application_id} value={a.application_id}>
                          {a.student?.name} ({a.student?.student_id}) — {a.scholarship?.scholarship_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Stage</label>
                  <div className="relative">
                    <select
                      value={form.stage}
                      onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
                      className="form-input appearance-none pr-9"
                    >
                      {STAGES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Amount (₹)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="form-input"
                    placeholder="e.g. 75000"
                    required
                    min={0}
                  />
                </div>
                <div>
                  <label className="form-label">Payment Status</label>
                  <div className="relative">
                    <select
                      value={form.payment_status}
                      onChange={(e) => setForm((f) => ({ ...f, payment_status: e.target.value }))}
                      className="form-input appearance-none pr-9"
                    >
                      <option>Pending</option>
                      <option>Completed</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Creating…' : 'Create Disbursement'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">
                {isAdmin ? `All Disbursements (${disbursements.length})` : `My Disbursements (${disbursements.length})`}
              </h2>
            </div>
            <div className="p-5">
              {loading ? (
                <div className="flex justify-center py-12"><div className="spinner" /></div>
              ) : (
                <DataTable
                  columns={columns}
                  data={disbursements}
                  emptyMessage="No disbursement records found."
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
