import { useEffect, useState } from 'react'
import { Plus, X, ChevronDown } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import TopHeader from '../components/TopHeader'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosClient'
import toast from 'react-hot-toast'

export default function ApplicationsPage() {
  const { isAdmin, isStudent } = useAuth()

  const [applications, setApplications] = useState([])
  const [scholarships, setScholarships] = useState([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [selectedScholarship, setSelectedScholarship] = useState('')
  const [submitting, setSubmitting]     = useState(false)

  // Admin: approve/reject modal
  const [actionApp, setActionApp]   = useState(null)
  const [actionStatus, setActionStatus] = useState('Approved')
  const [actionRemarks, setActionRemarks] = useState('')
  const [actioning, setActioning]   = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      const [appsRes, schRes] = await Promise.all([
        api.get(isAdmin ? '/applications/' : '/applications/me'),
        api.get('/scholarships/'),
      ])
      setApplications(appsRes.data)
      setScholarships(schRes.data)
    } catch (err) {
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [isAdmin])

  async function handleApply(e) {
    e.preventDefault()
    if (!selectedScholarship) return toast.error('Select a scholarship')
    try {
      setSubmitting(true)
      const res = await api.post('/applications/', { scholarship_id: Number(selectedScholarship) })
      toast.success(`Application submitted — Status: ${res.data.status}`)
      setShowForm(false)
      setSelectedScholarship('')
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAction(e) {
    e.preventDefault()
    try {
      setActioning(true)
      await api.patch(`/applications/${actionApp.application_id}`, {
        status: actionStatus,
        remarks: actionRemarks,
      })
      toast.success(`Application ${actionStatus.toLowerCase()} successfully`)
      setActionApp(null)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed')
    } finally {
      setActioning(false)
    }
  }

  const appliedIds = applications.map((a) => a.scholarship_id)

  const studentColumns = [
    { key: 'scholarship', label: 'Scholarship', render: (_, row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.scholarship?.scholarship_name}</p>
          <p className="text-xs text-slate-400">AY {row.scholarship?.academic_year} · ₹{row.scholarship?.amount?.toLocaleString('en-IN')}</p>
        </div>
      )
    },
    { key: 'application_date', label: 'Applied On', render: (v) => new Date(v).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'approval_date', label: 'Decision Date', render: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'remarks', label: 'Remarks', render: (v) => (
        <span className="text-xs text-slate-500 max-w-xs block truncate" title={v}>{v || '—'}</span>
      )
    },
  ]

  const adminColumns = [
    { key: 'student', label: 'Student', render: (_, row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.student?.name}</p>
          <p className="text-xs text-slate-400">{row.student?.student_id} · {row.student?.department}</p>
        </div>
      )
    },
    { key: 'scholarship', label: 'Scholarship', render: (_, row) => (
        <div>
          <p className="font-medium">{row.scholarship?.scholarship_name}</p>
          <p className="text-xs text-slate-400">₹{row.scholarship?.amount?.toLocaleString('en-IN')}</p>
        </div>
      )
    },
    { key: 'application_date', label: 'Applied', render: (v) => new Date(v).toLocaleDateString('en-IN') },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'remarks', label: 'Remarks', render: (v) => (
        <span className="text-xs text-slate-500 max-w-[180px] block truncate" title={v}>{v || '—'}</span>
      )
    },
    { key: 'action', label: 'Action', render: (_, row) => (
        row.status === 'Eligible' || row.status === 'Pending' ? (
          <button
            onClick={() => { setActionApp(row); setActionStatus('Approved'); setActionRemarks('') }}
            className="btn-outline text-xs py-1.5 px-3"
          >
            Review
          </button>
        ) : null
      )
    },
  ]

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <TopHeader
          title="Scholarship Applications"
          subtitle={isAdmin ? 'Manage and review all applications' : 'Apply and track your scholarship applications'}
        />
        <main className="content-area">
          {/* Apply button (student) */}
          {isStudent && (
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowForm(!showForm)} className="btn-primary" id="apply-btn">
                {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Apply for Scholarship</>}
              </button>
            </div>
          )}

          {/* Application form (student) */}
          {isStudent && showForm && (
            <div className="card p-6 mb-5 fade-in">
              <h3 className="font-bold text-slate-800 mb-4 text-lg">New Scholarship Application</h3>
              <form onSubmit={handleApply} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="form-label">Select Scholarship</label>
                  <div className="relative">
                    <select
                      id="scholarship-select"
                      value={selectedScholarship}
                      onChange={(e) => setSelectedScholarship(e.target.value)}
                      className="form-input appearance-none pr-9"
                    >
                      <option value="">— Choose a scholarship —</option>
                      {scholarships.map((s) => (
                        <option
                          key={s.scholarship_id}
                          value={s.scholarship_id}
                          disabled={appliedIds.includes(s.scholarship_id)}
                        >
                          {s.scholarship_name} — ₹{s.amount?.toLocaleString('en-IN')}
                          {appliedIds.includes(s.scholarship_id) ? ' (already applied)' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-end">
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Submitting…' : 'Submit Application'}
                  </button>
                </div>
              </form>

              {/* Scholarship details preview */}
              {selectedScholarship && (() => {
                const s = scholarships.find((x) => x.scholarship_id === Number(selectedScholarship))
                if (!s) return null
                return (
                  <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm fade-in">
                    <p className="font-semibold text-blue-900 mb-1">{s.scholarship_name}</p>
                    <p className="text-blue-700 text-xs mb-2">{s.description}</p>
                    <div className="flex gap-4 text-xs text-blue-800">
                      <span>Min CGPA: <b>{s.min_cgpa}</b></span>
                      <span>Top Rank: <b>{s.percentage_cutoff}%</b></span>
                      <span>Amount: <b>₹{s.amount?.toLocaleString('en-IN')}</b></span>
                    </div>
                    <p className="text-xs text-blue-500 mt-2">
                      ⚡ Eligibility will be evaluated automatically on submission.
                    </p>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Applications table */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">
                {isAdmin ? `All Applications (${applications.length})` : `My Applications (${applications.length})`}
              </h2>
            </div>
            <div className="p-5">
              {loading ? (
                <div className="flex justify-center py-12"><div className="spinner" /></div>
              ) : (
                <DataTable
                  columns={isAdmin ? adminColumns : studentColumns}
                  data={applications}
                  emptyMessage="No applications yet."
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Admin Review Modal */}
      {actionApp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 fade-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Review Application</h3>
                <p className="text-sm text-slate-400">{actionApp.student?.name} · {actionApp.scholarship?.scholarship_name}</p>
              </div>
              <button onClick={() => setActionApp(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 mb-4 text-sm">
              <p className="text-slate-500">{actionApp.remarks}</p>
            </div>

            <form onSubmit={handleAction} className="space-y-4">
              <div>
                <label className="form-label">Decision</label>
                <div className="flex gap-2">
                  {['Approved', 'Rejected'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setActionStatus(s)}
                      className={`flex-1 py-2 rounded-lg border font-semibold text-sm transition-all ${
                        actionStatus === s
                          ? s === 'Approved'
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-red-500 text-white border-red-500'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Remarks (optional)</label>
                <textarea
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  rows={2}
                  className="form-input resize-none"
                  placeholder="Add a note for the student…"
                />
              </div>
              <button type="submit" disabled={actioning} className="btn-primary w-full justify-center">
                {actioning ? 'Saving…' : 'Confirm Decision'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
