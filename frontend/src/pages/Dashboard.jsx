import { useEffect, useState } from 'react'
import { Users, FileText, CheckCircle, XCircle, Clock, Banknote, TrendingUp, Award } from 'lucide-react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopHeader from '../components/TopHeader'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosClient'

export default function Dashboard() {
  const { isAdmin, studentId } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentApps, setRecentApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        if (isAdmin) {
          const [statsRes, appsRes] = await Promise.all([
            api.get('/admin/stats'),
            api.get('/applications/'),
          ])
          setStats(statsRes.data)
          setRecentApps(appsRes.data.slice(0, 5))
        } else {
          const [statsRes, appsRes] = await Promise.all([
            api.get(`/admin/student-stats/${studentId}`),
            api.get('/applications/me'),
          ])
          setStats(statsRes.data)
          setRecentApps(appsRes.data.slice(0, 5))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isAdmin, studentId])

  function fmt(n) { return n?.toLocaleString('en-IN') ?? '0' }
  function fmtCurrency(n) { return `₹${(n || 0).toLocaleString('en-IN')}` }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <TopHeader
          title="Dashboard"
          subtitle={isAdmin ? 'System overview — all scholarship metrics' : 'Your scholarship summary'}
        />
        <main className="content-area">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="spinner" />
            </div>
          ) : (
            <>
              {/* ── Admin Stats Grid ── */}
              {isAdmin && stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatCard label="Total Students"    value={fmt(stats.total_students)}    icon={Users}      color="orange" />
                  <StatCard label="Total Applications" value={fmt(stats.total_applications)} icon={FileText}   color="orange" />
                  <StatCard label="Approved"           value={fmt(stats.approved_count)}    icon={CheckCircle} color="green" />
                  <StatCard label="Rejected"           value={fmt(stats.rejected_count)}    icon={XCircle}    color="red" />
                  <StatCard label="Eligible (Awaiting Approval)" value={fmt(stats.eligible_count)} icon={TrendingUp} color="orange" sub="Ready for review" />
                  <StatCard label="Pending Review"     value={fmt(stats.pending_count)}     icon={Clock}      color="orange" />
                  <StatCard label="Total Disbursed"    value={fmtCurrency(stats.total_disbursed)} icon={Banknote} color="green" sub="Payment Completed" />
                  <StatCard label="Programs Active"    value="3" icon={Award} color="orange" />
                </div>
              )}

              {/* ── Student Stats Grid ── */}
              {!isAdmin && stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatCard
                    label="Latest Yearly CGPA"
                    value={stats.latest_cgpa?.toFixed(2) ?? '—'}
                    icon={TrendingUp}
                    color="orange"
                    sub={`${stats.student?.department} Engineering`}
                  />
                  <StatCard
                    label="Dept. Ranking"
                    value={stats.latest_rank ? `#${stats.latest_rank}` : '—'}
                    icon={Award}
                    color="orange"
                    sub="Current position"
                  />
                  <StatCard
                    label="Scholarship Claims"
                    value={stats.total_applications}
                    icon={FileText}
                    color="orange"
                  />
                  <StatCard
                    label="Approved Grants"
                    value={stats.approved_applications}
                    icon={CheckCircle}
                    color="green"
                    sub={`${fmtCurrency(stats.total_disbursed)} received`}
                  />
                </div>
              )}

              {/* ── Recent Applications ── */}
              <div className="card p-0 overflow-hidden fade-in">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="font-extrabold text-slate-800 uppercase text-xs tracking-widest">
                    {isAdmin ? 'System-wide Recent Applications' : 'My Recent Applications'}
                  </h2>
                  <Link to="/applications" className="text-[10px] text-[#e37412] font-black uppercase tracking-widest hover:underline">
                    View full history →
                  </Link>
                </div>
                {recentApps.length === 0 ? (
                  <div className="empty-state">
                    <p>No transactions found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          {isAdmin && <th>Student Details</th>}
                          <th>Scholarship Program</th>
                          <th>Request Date</th>
                          <th>Status</th>
                          {isAdmin && <th>Department</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {recentApps.map((app) => (
                          <tr key={app.application_id} className="hover:bg-slate-50/30">
                            {isAdmin && (
                              <td>
                                <div>
                                  <p className="font-bold text-slate-700">{app.student?.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{app.student?.student_id}</p>
                                </div>
                              </td>
                            )}
                            <td>
                              <p className="font-bold text-slate-700">{app.scholarship?.scholarship_name}</p>
                              <p className="text-[10px] font-bold text-slate-400">AY {app.scholarship?.academic_year}</p>
                            </td>
                            <td className="text-slate-500 font-medium text-sm">
                              {new Date(app.application_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td><StatusBadge status={app.status} /></td>
                            {isAdmin && <td className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.student?.department}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
    <div className="mt-8 text-center">
      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Portal Version 2.0 • 2025 Manipal</p>
    </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
