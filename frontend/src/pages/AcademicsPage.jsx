import { useEffect, useState } from 'react'
import { BookOpen, TrendingUp, Award, User, Database, GraduationCap } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import TopHeader from '../components/TopHeader'
import DataTable from '../components/DataTable'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosClient'
import toast from 'react-hot-toast'

export default function AcademicsPage() {
  const { isAdmin, role } = useAuth()
  const [records, setRecords] = useState([])
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        if (isAdmin) {
          // Admin: Load all records
          const res = await api.get('/academic-records/')
          setRecords(res.data)
        } else {
          // Student: Load personal profile and records
          const [recRes, stuRes] = await Promise.all([
            api.get('/academic-records/me'),
            api.get('/students/me'),
          ])
          setRecords(recRes.data)
          setStudent(stuRes.data)
        }
      } catch {
        toast.error('Failed to load academic data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAdmin])

  // Logic for Student View (Yearly Aggregation)
  const yearlyRecords = records.filter(r => {
    const yearRecords = records.filter(x => x.academic_year === r.academic_year)
    const maxSem = Math.max(...yearRecords.map(x => x.semester))
    return r.semester === maxSem
  }).sort((a, b) => a.academic_year.localeCompare(b.academic_year))

  const latest = yearlyRecords.length > 0 ? yearlyRecords[yearlyRecords.length - 1] : null

  // Columns for Admin View
  const adminColumns = [
    { key: 'student_id', label: 'Student ID', render: (v) => <span className="font-bold text-slate-700">{v}</span> },
    { key: 'academic_year', label: 'Academic Year' },
    { key: 'cgpa', label: 'Yearly CGPA', render: (v) => <span className="font-black text-orange-600">{v?.toFixed(2)}</span> },
    { key: 'rank', label: 'Dept Rank', render: (v) => <span className="badge badge-eligible">#{v}</span> },
  ]

  // Grouping logic for Admin (Keep only latest semester entry per year per student)
  const groupedAdminRecords = isAdmin ? records.filter(r => {
    const studentYearRecords = records.filter(x => x.student_id === r.student_id && x.academic_year === r.academic_year)
    const maxSem = Math.max(...studentYearRecords.map(x => x.semester))
    return r.semester === maxSem
  }) : []

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <TopHeader
          title={isAdmin ? 'Student Academic Database' : 'My Academic Profile'}
          subtitle={isAdmin ? 'Consolidated yearly CGPA records for all registered students' : 'Cumulative yearly progress and department rankings'}
        />
        <main className="content-area">
          {loading ? (
            <div className="flex justify-center items-center h-48"><div className="spinner" /></div>
          ) : isAdmin ? (
            /* ──────────────── Admin Master View ──────────────── */
            <div className="max-w-6xl mx-auto space-y-6 fade-in">
              <div className="card overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <Database size={20} className="text-[#e37412]" />
                     <h3 className="font-extrabold text-slate-800 uppercase text-xs tracking-widest">Master Academic Records</h3>
                   </div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yearly CGPA aggregation</span>
                </div>
                <div className="p-0">
                  <DataTable
                    columns={adminColumns}
                    data={groupedAdminRecords}
                    emptyMessage="No academic records found in the system."
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ──────────────── Student Personal View ──────────────── */
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              {/* Student Header Card */}
              {student && (
                <div className="card p-8 bg-white border-l-8 border-l-[#e37412] transform transition-all hover:scale-[1.01]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-[#e37412] shadow-sm border border-orange-100">
                        <User size={32} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{student.name}</h2>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{student.student_id}</span>
                          <span className="text-xs font-bold text-slate-300">•</span>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{student.department} Engineering</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-10 bg-slate-50 px-8 py-4 rounded-2xl border border-slate-100">
                      <div className="text-center">
                        <p className="text-3xl font-black text-[#e37412] leading-none mb-1">{student.cgpa?.toFixed(2)}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregate CGPA</p>
                      </div>
                      <div className="w-[1px] h-10 bg-slate-200"></div>
                      <div className="text-center">
                        <p className="text-3xl font-black text-slate-800 leading-none mb-1">#{latest?.rank || '-'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Rank</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="card overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BookOpen size={20} className="text-[#e37412]" />
                        <h3 className="font-extrabold text-slate-800 uppercase text-xs tracking-widest">Academic History</h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yearly CGPA Only</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Academic Year</th>
                            <th>Yearly CGPA</th>
                            <th className="text-right">Ranking</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yearlyRecords.map((record, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="font-bold text-slate-700">{record.academic_year}</td>
                              <td>
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div 
                                      className="h-full bg-[#e37412] rounded-full" 
                                      style={{ width: `${(record.cgpa / 10) * 100}%` }}
                                    />
                                  </div>
                                  <span className="font-black text-slate-800">{record.cgpa.toFixed(2)}</span>
                                </div>
                              </td>
                              <td className="text-right">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-[#e37412] font-black text-xs border border-orange-100">
                                  <Award size={12} />
                                  Rank #{record.rank}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <TrendingUp size={20} className="text-[#e37412]" />
                      <h3 className="font-extrabold text-slate-800 uppercase text-xs tracking-widest">Progress Chart</h3>
                    </div>
                    <div className="flex items-end justify-between gap-4 h-40 pt-6 px-2">
                       {yearlyRecords.map((r, i) => {
                         const height = (r.cgpa / 10) * 100;
                         return (
                           <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative">
                             <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded">
                               CGPA {r.cgpa.toFixed(2)}
                             </div>
                             <div 
                               className="w-full rounded-t-lg bg-orange-100 group-hover:bg-[#e37412] transition-colors relative"
                               style={{ height: `${height}%` }}
                             >
                               <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             </div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">
                               {r.academic_year.split('-')[1]}
                             </span>
                           </div>
                         )
                       })}
                    </div>
                  </div>

                  <div className="bg-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-200 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
                    <GraduationCap size={48} className="text-white/20 mb-4" />
                    <h4 className="text-lg font-black leading-tight mb-2">Merit Scholarship Eligibility</h4>
                    <p className="text-orange-100 text-xs font-medium leading-relaxed opacity-80">
                      Keep your yearly CGPA above 9.0 and stay in the top 10% of your department to maintain your Merit Excellence Scholarship status.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
