import React, { useState } from 'react';
import { X, Globe, ChevronDown } from 'lucide-react';

type Props = {
  onLogin: () => void;
};

// ── Google Sign-in Modal ──────────────────────────────────────────────────────
function GoogleLoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleGoogle = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 1400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(15,10,40,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[400px] mx-4 p-8 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Logo */}
        <img src="/scimaster_icon.svg" alt="SciMaster" className="w-12 h-12 mb-4" />

        <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome to SciMaster</h2>
        <p className="text-sm text-slate-500 mb-7 text-center">
          Sign in to start your AI-powered research journey
        </p>

        {/* Google Button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl px-5 py-3 text-[15px] font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg className="w-5 h-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
              <path d="M44.5 20H24v8.5h11.7C34.2 33.3 29.7 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l6-6C34.4 6.5 29.5 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5C35.3 45.5 44.5 36.5 44.5 25c0-.9-.1-1.7-.2-2.5-.1-.8-.1-1.6-.1-2.5z" fill="#FFC107"/>
              <path d="M6.3 14.7l7 5.1C15 16.1 19.2 13 24 13c3 0 5.8 1.1 7.9 3l6-6C34.4 6.5 29.5 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z" fill="#FF3D00"/>
              <path d="M24 45.5c5.4 0 10.3-1.9 14.1-5.1l-6.5-5.5C29.5 36.8 26.9 38 24 38c-5.7 0-10.5-3.8-12.2-9l-7 5.4C8.3 41.6 15.6 45.5 24 45.5z" fill="#4CAF50"/>
              <path d="M44.5 20H24v8.5h11.7c-.8 2.3-2.4 4.3-4.4 5.7l6.5 5.5C41.7 36.5 44.5 31.1 44.5 25c0-.9-.1-1.7-.2-2.5-.1-.8-.1-1.6-.1-2.5z" fill="#1976D2"/>
            </svg>
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <p className="mt-6 text-xs text-slate-400 text-center leading-relaxed">
          By continuing, you agree to our{' '}
          <span className="underline cursor-pointer hover:text-slate-600">Terms of Service</span>
          {' '}and{' '}
          <span className="underline cursor-pointer hover:text-slate-600">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────
export default function LandingPage({ onLogin }: Props) {
  const [showModal, setShowModal] = useState(false);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);
  const handleSuccess = () => {
    setShowModal(false);
    onLogin();
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Background gradient ── */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: 'linear-gradient(135deg, #f0eeff 0%, #e8f8f5 40%, #d4f0f0 70%, #e0f7f4 100%)',
        }}
      />
      {/* Decorative blobs */}
      <div className="fixed -z-10 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #c4b5fd 0%, transparent 70%)', top: '-100px', left: '-150px' }} />
      <div className="fixed -z-10 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #5eead4 0%, transparent 70%)', top: '100px', right: '-100px' }} />

      {/* ── Header ── */}
      <header className="w-full h-20 flex items-center justify-between px-10 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <img src="/scimaster_icon.svg" alt="SciMaster" className="w-7 h-7" />
          <span className="text-[20px] font-bold text-slate-900 tracking-tight">SciMaster</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 transition-colors">
            <Globe size={15} className="text-slate-500" />
            <span>English</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>
          <button
            onClick={openModal}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)' }}
          >
            Try For Free
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-24">

        {/* Headline */}
        <h1
          className="text-center font-bold leading-[1.15] mb-6"
          style={{
            fontSize: 'clamp(2.4rem, 5vw, 4rem)',
            color: '#1a1060',
            fontFamily: "'Georgia', serif",
            maxWidth: '860px',
          }}
        >
          Your AI Scientist Friend<br />From Ideation To Publication
        </h1>

        {/* Promo banner */}
        <div className="mb-8">
          <div
            className="px-6 py-2 rounded-full text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)' }}
          >
            Sign up now to claim $15 worth of premium benefits for free !
          </div>
        </div>

        {/* Subtext */}
        <p className="text-center text-slate-600 text-base leading-relaxed mb-14" style={{ maxWidth: '520px' }}>
          Choose the best path for your research. Whether you have data ready or need a
          creative spark, we're here to help.
        </p>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full" style={{ maxWidth: '900px' }}>

          {/* Start Brainstorming */}
          <button
            onClick={openModal}
            className="group text-left bg-white/80 backdrop-blur-sm rounded-3xl p-9 shadow-[0_4px_24px_rgba(100,80,200,0.08)] border border-white hover:shadow-[0_8px_40px_rgba(100,80,200,0.15)] hover:-translate-y-1 transition-all duration-200"
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
              style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            </div>

            <h3 className="text-[22px] font-bold text-slate-900 mb-3">Start Brainstorming</h3>
            <p className="text-[15px] text-slate-500 leading-relaxed mb-8">
              Start from scratch with AI guidance. Explore research ideas and develop hypotheses.
            </p>

            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#7c3aed] tracking-wide uppercase group-hover:gap-3 transition-all">
              EXPLORE IDEAS
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Start Writing */}
          <button
            onClick={openModal}
            className="group text-left bg-white/80 backdrop-blur-sm rounded-3xl p-9 shadow-[0_4px_24px_rgba(100,80,200,0.08)] border border-white hover:shadow-[0_8px_40px_rgba(100,80,200,0.15)] hover:-translate-y-1 transition-all duration-200"
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
              style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)' }}>
              <svg width="28" height="32" viewBox="0 0 24 28" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="2" width="18" height="22" rx="2" />
                <path d="M7 8h10M7 12h10M7 16h6" />
              </svg>
            </div>

            <h3 className="text-[22px] font-bold text-slate-900 mb-3">Start Writing</h3>
            <p className="text-[15px] text-slate-500 leading-relaxed mb-8">
              Enter a research topic or upload your materials to begin. We'll generate a structured draft for you.
            </p>

            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#7c3aed] tracking-wide uppercase group-hover:gap-3 transition-all">
              GET STARTED
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full px-16 pb-8 flex-shrink-0">
        <div className="border-t border-slate-200/60 pt-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/scimaster_icon.svg" alt="SciMaster" className="w-6 h-6" />
              <span className="text-[15px] font-bold text-slate-800">SciMaster</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              {['Contact', 'About Us', 'FAQ', 'Privacy Policy & Terms'].map((t) => (
                <span key={t} className="cursor-pointer hover:text-slate-700 transition-colors">{t}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">© 2026 SciLand</p>
          </div>
        </div>
      </footer>

      {/* ── Google Login Modal ── */}
      {showModal && (
        <GoogleLoginModal onClose={closeModal} onSuccess={handleSuccess} />
      )}
    </div>
  );
}
