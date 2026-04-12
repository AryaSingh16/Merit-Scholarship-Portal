import { useEffect, useState } from 'react'
import { RefreshCw, ShieldCheck, Plus, X, Database, Upload, Wifi, ChevronDown, Trash2 } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import TopHeader from '../components/TopHeader'
import DataTable from '../components/DataTable'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosClient'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const { isAdmin } = useAuth()
  const [scholarships, setScholarships] = useState([])
  const [students, setStudents]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [seeding, setSeeding]           = useState(false)
  const [showSchForm, setShowSchForm]   = useState(false)
  const [schForm, setSchForm] = useState({
    scholarship_name: '', min_cgpa: '', percentage_cutoff: '',
    academic_year: '2023-24', amount: '', description: '',
  })
  const [creating, setCreating] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      const [schRes, stuRes] = await Promise.all([
        api.get('/scholarships/'),
        api.get('/students/'),
      ])
      setScholarships(schRes.data)
      setStudents(stuRes.data)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  async function handleSeed() {
    if (!window.confirm('This will DROP and RE-SEED all data. Continue?')) return
    try {
      setSeeding(true)
      const res = await api.post('/admin/seed')
      toast.success('Database re-seeded! ' + JSON.stringify(res.data.record_counts))
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Seed failed')
    } finally { setSeeding(false) }
  }

  async function handleCreateScholarship(e) {
    e.preventDefault()
    try {
      setCreating(true)
      await api.post('/scholarships/', {
        ...schForm,
        min_cgpa: Number(schForm.min_cgpa),
        percentage_cutoff: Number(schForm.percentage_cutoff),
        amount: Number(schForm.amount),
      })
      toast.success('Scholarship created!')
      setShowSchForm(false)
      setSchForm({ scholarship_name:'', min_cgpa:'', percentage_cutoff:'', academic_year:'2023-24', amount:'', description:'' })
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create scholarship')
    } finally { setCreating(false) }
  }

  async function handleDeleteScholarship(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/scholarships/${id}`)
      toast.success('Scholarship deleted')
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Delete failed')
    }
  }

  const schColumns = [
    { key: 'scholarship_name', label: 'Name', render: (v, row) => (
        <div>
          <p className="font-semibold text-slate-800">{v}</p>
          <p className="text-xs text-slate-400">{row.description}</p>
        </div>
      )
    },
    { key: 'academic_year',    label: 'AY' },
    { key: 'min_cgpa',         label: 'Min CGPA', render: (v) => <span className="font-semibold text-blue-700">{v}</span> },
    { key: 'percentage_cutoff',label: 'Top %',    render: (v) => `${v}%` },
    { key: 'amount',           label: 'Amount',   render: (v) => `₹${v?.toLocaleString('en-IN')}` },
    { key: 'del', label: '', render: (_, row) => (
        <button onClick={() => handleDeleteScholarship(row.scholarship_id, row.scholarship_name)} className="btn-danger text-xs py-1.5 px-3">
          <Trash2 size={13} />
        </button>
      )
    },
  ]

  const studentColumns = [
    { key: 'student_id',  label: 'ID' },
    { key: 'name',        label: 'Name',       render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'department',  label: 'Department' },
    { key: 'section',     label: 'Section' },
    { key: 'cgpa',        label: 'CGPA',       render: (v) => <span className="font-bold text-blue-700">{v?.toFixed(2)}</span> },
  ]

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <TopHeader title="Admin Panel" subtitle="Data management, scholarship config, and future integrations" />
        <main className="content-area">

          {/* ── Action Tiles ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Seed */}
            <div className="card p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow">
                  <Database size={18} color="white" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Re-seed Database</p>
                  <p className="text-xs text-slate-400">Reset with mock data</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Drops all existing records and populates the database with 10 students,
                3 scholarships, and sample applications via <code className="bg-slate-100 px-1 rounded">MockDataRepository</code>.
              </p>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="btn-primary mt-auto"
                id="seed-btn"
              >
                {seeding ? <><RefreshCw size={14} className="animate-spin" />Seeding…</> : <><RefreshCw size={14} />Seed / Reset Data</>}
              </button>
            </div>

            {/* Excel Upload Placeholder */}
            <div className="card p-5 flex flex-col gap-3 border-dashed border-2 border-slate-200 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Upload size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-700 text-sm flex items-center gap-1">
                    Excel/CSV Upload
                    <span className="text-xs font-normal bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full ml-1">Soon</span>
                  </p>
                  <p className="text-xs text-slate-400">POST /api/admin/upload-academic-excel</p>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Once admin approval is granted, this module will accept <b>.xlsx/.csv</b> uploads
                and populate academic records via <code className="bg-slate-100 px-1 rounded">CSVExcelRepository</code>.
              </p>
              <button
                disabled
                className="mt-auto flex items-center gap-2 py-2 px-4 rounded-lg bg-slate-200 text-slate-400 text-sm font-semibold cursor-not-allowed"
              >
                <Upload size={14} /> Upload File (Pending Approval)
              </button>
            </div>

            {/* SLCM Sync Placeholder */}
            <div className="card p-5 flex flex-col gap-3 border-dashed border-2 border-slate-200 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Wifi size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-700 text-sm flex items-center gap-1">
                    SLCM API Sync
                    <span className="text-xs font-normal bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full ml-1">Soon</span>
                  </p>
                  <p className="text-xs text-slate-400">GET /api/sync-slcm</p>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Once API credentials are obtained, this will fetch live academic records
                from the college SLCM portal via <code className="bg-slate-100 px-1 rounded">SLCMAPIRepository</code>.
              </p>
              <button
                disabled
                className="mt-auto flex items-center gap-2 py-2 px-4 rounded-lg bg-slate-200 text-slate-400 text-sm font-semibold cursor-not-allowed"
              >
                <Wifi size={14} /> Sync SLCM (Credentials Required)
              </button>
            </div>
          </div>

          {/* ── Manage Scholarships ── */}
          <div className="card p-0 overflow-hidden mb-5">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-500" />
                <h2 className="font-bold text-slate-800">Scholarship Catalog ({scholarships.length})</h2>
              </div>
              <button onClick={() => setShowSchForm(!showSchForm)} className="btn-primary text-xs py-1.5 px-3">
                {showSchForm ? <><X size={13} /> Cancel</> : <><Plus size={13} /> Add Scholarship</>}
              </button>
            </div>

            {showSchForm && (
              <form onSubmit={handleCreateScholarship} className="p-5 border-b border-slate-100 bg-slate-50 fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="form-label">Scholarship Name</label>
                    <input required value={schForm.scholarship_name} onChange={(e) => setSchForm(f=>({...f,scholarship_name:e.target.value}))} className="form-input" placeholder="e.g. Dean's Honor Scholarship" />
                  </div>
                  <div>
                    <label className="form-label">Academic Year</label>
                    <input required value={schForm.academic_year} onChange={(e) => setSchForm(f=>({...f,academic_year:e.target.value}))} className="form-input" placeholder="2023-24" />
                  </div>
                  <div>
                    <label className="form-label">Min CGPA</label>
                    <input required type="number" step="0.1" min="0" max="10" value={schForm.min_cgpa} onChange={(e) => setSchForm(f=>({...f,min_cgpa:e.target.value}))} className="form-input" placeholder="e.g. 8.5" />
                  </div>
                  <div>
                    <label className="form-label">Rank Cutoff (%)</label>
                    <input required type="number" step="0.1" min="1" max="100" value={schForm.percentage_cutoff} onChange={(e) => setSchForm(f=>({...f,percentage_cutoff:e.target.value}))} className="form-input" placeholder="e.g. 25" />
                  </div>
                  <div>
                    <label className="form-label">Amount (₹)</label>
                    <input required type="number" min="0" value={schForm.amount} onChange={(e) => setSchForm(f=>({...f,amount:e.target.value}))} className="form-input" placeholder="e.g. 50000" />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="form-label">Description</label>
                    <input value={schForm.description} onChange={(e) => setSchForm(f=>({...f,description:e.target.value}))} className="form-input" placeholder="Brief description of eligibility criteria and purpose" />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button type="submit" disabled={creating} className="btn-primary">
                    {creating ? 'Creating…' : 'Create Scholarship'}
                  </button>
                </div>
              </form>
            )}

            <div className="p-5">
              {loading ? <div className="flex justify-center py-10"><div className="spinner" /></div>
                : <DataTable columns={schColumns} data={scholarships} emptyMessage="No scholarships configured." />}
            </div>
          </div>

          {/* ── Students List ── */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <ShieldCheck size={18} className="text-indigo-500" />
              <h2 className="font-bold text-slate-800">Registered Students ({students.length})</h2>
            </div>
            <div className="p-5">
              {loading ? <div className="flex justify-center py-10"><div className="spinner" /></div>
                : <DataTable columns={studentColumns} data={students} emptyMessage="Run seed to populate students." />}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
