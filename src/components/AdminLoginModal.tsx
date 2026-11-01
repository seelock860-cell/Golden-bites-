import React, { useState } from 'react';
import { X, Lock, User, Eye, EyeOff, ShieldAlert, ArrowRight } from 'lucide-react';
import { loginAdmin } from '../services/store';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  if (!isOpen) return null;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      const res = loginAdmin(username, password);
      setLoading(false);
      if (res.success) {
        onLoginSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || 'Invalid credentials. Please verify your username and password.');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-[#0e0d13] border border-[#30291a] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-[#18161f] text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 border-b border-[#231e13] bg-[#121118] text-center">
          <div className="w-12 h-12 rounded-xl bg-[#221c10] border border-[#d4af37]/40 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-[#d4af37]" />
          </div>
          <h2 className="font-serif-luxury text-xl font-bold text-white">
            Staff & Manager Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Golden Bite Restaurant Management Console
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Temporary credentials notice banner */}
          <div className="p-3 rounded-xl bg-[#171510] border border-[#382d12] text-[11px] text-amber-200/90 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <span>Initial staff login: User: <strong className="text-white font-mono">god</strong> / Password: <strong className="text-white font-mono">god123</strong>.</span>
              <span className="block text-slate-400 text-[10px] mt-0.5">You can update this password inside the dashboard Security tab.</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Enter staff username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white pl-9 pr-3 py-2.5 rounded-xl text-xs focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter staff password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white pl-9 pr-10 py-2.5 rounded-xl text-xs focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider gold-gradient-bg text-black hover:brightness-110 active:scale-95 shadow-lg shadow-[#d4af37]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Access Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-slate-400 pt-1">
            Protected area. All administrative sessions and operations are audited.
          </p>

        </form>

      </div>
    </div>
  );
};
