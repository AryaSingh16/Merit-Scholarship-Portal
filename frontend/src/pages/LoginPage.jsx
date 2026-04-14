import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import logo from '../assets/logo.png'

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Already logged in
  if (isAuthenticated) { navigate('/'); return null }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Signed in successfully')
      navigate('/')
    } catch (err) {
      toast.error('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>
      {/* Sidebar / Illustration Panel */}
      <div className="hidden lg:flex w-[450px] flex-col justify-center items-center px-12 text-white shadow-2xl z-10" style={{ background: 'linear-gradient(135deg, #e37412 0%, #c2410c 100%)' }}>
        <div className="w-40 h-40 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-10 shadow-2xl overflow-hidden p-6 hover:scale-105 transition-transform duration-500">
           <img src={logo} alt="Manipal Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-4xl font-black mb-4 text-center leading-tight tracking-tight">
          Manipal<br/>Scholarship Portal
        </h1>
        <div className="w-16 h-1.5 bg-white/30 rounded-full mb-12"></div>
        
      </div>

      {/* Login Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-10 relative overflow-hidden">
            {/* Minimal Background Element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
            
            {/* Header */}
            <div className="text-center mb-10 relative z-10">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Sign In</h2>
              <p className="text-slate-400 font-medium">Manipal Scholarship Management</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:text-orange-500 transition-colors">
                      <Mail size={18} />
                    </div>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student_id@manipal.edu"
                    className="form-input"
                    style={{ paddingLeft: '3rem', height: '54px', borderRadius: '14px', border: '2px solid #f1f5f9' }}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:text-orange-500 transition-colors">
                      <Lock size={18} />
                    </div>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="form-input"
                    style={{ paddingLeft: '3rem', height: '54px', borderRadius: '14px', border: '2px solid #f1f5f9' }}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-4 text-base shadow-xl hover:shadow-orange-200/50"
                style={{ borderRadius: '16px' }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Enter Portal'}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-50 text-center">
              <p className="text-sm font-bold text-slate-800 mb-4 opacity-30">DEMO CREDENTIALS</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left">Student</p>
                  <p className="text-xs font-bold text-slate-700 text-left">23CS001@manipal.edu</p>
                  <p className="text-xs text-slate-500 text-left">Manipal@23CS001</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left">Admin</p>
                  <p className="text-xs font-bold text-slate-700 text-left">admin@manipal.edu</p>
                  <p className="text-xs text-slate-500 text-left">Admin@Manipal2025</p>
                </div>
              </div>
            </div>
          </div>
          
          <p className="mt-8 text-center text-slate-400 text-sm font-medium uppercase tracking-[0.2em] opacity-50">
            © 2025 Manipal University
          </p>
        </div>
      </div>
    </div>
  )
}
