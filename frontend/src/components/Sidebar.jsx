import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  CreditCard,
  GraduationCap,
  LogOut,
  ShieldAlert
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const { isAdmin, role, userName, studentId, logout } = useAuth()

  return (
    <div className="sidebar">
      {/* Brand Section */}
      <div className="p-7 mb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
            <GraduationCap size={22} className="text-[#e37412]" />
          </div>
          <div>
            <h2 className="text-white font-black text-sm tracking-tight leading-none uppercase text-left">Manipal</h2>
            <p className="text-orange-100/60 text-[10px] font-bold tracking-widest uppercase mt-1 text-left">Scholarship Portal</p>
          </div>
        </div>
        <div className="h-[1px] w-full bg-white/10"></div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/applications" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <ClipboardList size={18} />
          <span>Applications</span>
        </NavLink>

        <NavLink to="/academics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BookOpen size={18} />
          <span>{isAdmin ? 'Student Academics' : 'My Academics'}</span>
        </NavLink>

        <NavLink to="/disbursements" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <CreditCard size={18} />
          <span>Disbursements</span>
        </NavLink>

        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ShieldAlert size={18} />
            <span>Admin Control</span>
          </NavLink>
        )}
      </nav>

      {/* User / Footer */}
      <div className="mt-auto p-4 border-t border-white/10 bg-black/5">
        <div className="px-3">
          <p className="text-white font-bold text-sm truncate">{userName || 'User'}</p>
          <p className="text-orange-200/50 text-[10px] font-bold uppercase tracking-wider mt-0.5">
            {isAdmin ? 'System Administrator' : studentId}
          </p>
        </div>
        <div className="mt-4 text-center">
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">© 2025 Manipal</p>
        </div>
      </div>
    </div>
  )
}
