import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import {
  FigmaPinIcon,
  IconlyThemeToggleButton,
} from '../components/ui/FigmaWidgets';

type AuthMode = 'signin' | 'signup';

export const AuthLandingView: React.FC = () => {
  const { signIn, signUpSpectator, theme, toggleTheme } = useTournament();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'signin') {
      const res = signIn(identifier, password);
      if (!res.ok) {
        setErrorMessage(res.error);
      }
    } else {
      const res = signUpSpectator({
        username,
        contact,
        password,
      });
      if (!res.ok) {
        setErrorMessage(res.error);
      }
    }
  };

  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full bg-[#141513] text-white flex flex-col items-center justify-center px-4 py-10 overflow-hidden">
      {/* Top-Right Theme Toggle on Landing Screen */}
      <div className="fixed top-4 right-4 z-20">
        <IconlyThemeToggleButton theme={theme} onToggle={toggleTheme} />
      </div>

      {/* Faded / Transparent Goal-Net Pitch Background (Landing Page Background.jpg) */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <img
          src="/landing-bg.jpg"
          alt=""
          className={`w-full h-full object-cover object-center scale-[1.01] ${
            theme === 'light' ? 'opacity-[0.18]' : 'opacity-[0.24]'
          }`}
        />
        {theme === 'light' ? (
          <div className="absolute inset-0 bg-gradient-to-b from-[#F3F5EE]/75 via-[#F3F5EE]/55 to-[#F3F5EE]/92" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-[#141513]/80 via-[#141513]/55 to-[#141513]/92" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 50% 35%, rgba(20, 21, 19, 0.15) 0%, rgba(20, 21, 19, 0.85) 85%)',
              }}
            />
          </>
        )}
      </div>

      {/* Foreground Content Container */}
      <div className="relative z-10 w-full max-w-[410px] space-y-6">
        {/* Official Tournament Crest & Event Header */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <img
            src="/kots-logo.png?v=2"
            alt="King of the Streets — 7 Aside & 1v1 Tournament"
            className="w-44 sm:w-48 h-auto object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.65)] select-none"
          />

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#161616]/85 border border-white/10 backdrop-blur-sm">
            <FigmaPinIcon className="w-3.5 h-3.5 text-[#7C9A32]" />
            <span className="font-quicksand text-[11px] font-normal text-[#9E9E9E] tracking-wide">
              Ballmania, Runda • 14th November
            </span>
          </div>
        </div>

        {/* Auth Glassmorphic Card */}
        <div className="rounded-[24px] bg-[#161616]/90 backdrop-blur-md border border-white/[0.08] p-6 shadow-2xl space-y-5">
          {/* Mode Switcher matching Figma Active/Inactive Pill Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-[#141513] p-1.5 rounded-full border border-white/[0.06]">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`h-[40px] rounded-full text-xs font-bold transition-all ${
                mode === 'signin'
                  ? 'bg-white text-[#161616] border-2 border-[#C8F558] shadow-sm'
                  : 'text-[#8E8E8E] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`h-[40px] rounded-full text-xs font-bold transition-all ${
                mode === 'signup'
                  ? 'bg-white text-[#161616] border-2 border-[#C8F558] shadow-sm'
                  : 'text-[#8E8E8E] hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              {mode === 'signin'
                ? 'Welcome Back'
                : 'Create Spectator Account'}
            </h1>
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-[#D9383A]/15 border border-[#D9383A]/45 px-3.5 py-2.5 flex items-start gap-2.5 text-xs text-white">
              <AlertCircle className="w-4 h-4 text-[#D9383A] shrink-0 mt-0.5" />
              <span className="font-quicksand font-medium leading-snug">
                {errorMessage}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signin' ? (
              <div>
                <label className="block font-quicksand text-[11px] font-normal text-[#9E9E9E] mb-1.5">
                  Username, Email or Phone
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-[#8E8E8E] absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your username or phone"
                    autoComplete="username"
                    className="w-full rounded-xl bg-[#141513] border border-white/10 pl-10 pr-3.5 py-3 text-xs font-normal text-white placeholder-[#6E6E6E] focus:border-[#C8F558] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block font-quicksand text-[11px] font-normal text-[#9E9E9E] mb-1.5">
                    Username
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-[#8E8E8E] absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a display name"
                      autoComplete="username"
                      className="w-full rounded-xl bg-[#141513] border border-white/10 pl-10 pr-3.5 py-3 text-xs font-normal text-white placeholder-[#6E6E6E] focus:border-[#C8F558] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-quicksand text-[11px] font-normal text-[#9E9E9E] mb-1.5">
                    Email or Phone Number
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-[#8E8E8E] absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="e.g. 0712345678 or name@email.com"
                      autoComplete="email"
                      className="w-full rounded-xl bg-[#141513] border border-white/10 pl-10 pr-3.5 py-3 text-xs font-normal text-white placeholder-[#6E6E6E] focus:border-[#C8F558] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block font-quicksand text-[11px] font-normal text-[#9E9E9E] mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#8E8E8E] absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === 'signin'
                      ? 'Enter your password'
                      : 'Create a password (min. 4 chars)'
                  }
                  autoComplete={
                    mode === 'signin' ? 'current-password' : 'new-password'
                  }
                  className="w-full rounded-xl bg-[#141513] border border-white/10 pl-10 pr-10 py-3 text-xs text-white placeholder-[#6E6E6E] focus:border-[#C8F558] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 text-[#8E8E8E] hover:text-white p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-[46px] mt-1 rounded-full bg-[#C8F558] hover:bg-[#d4f87a] text-[#161616] font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <span>
                {mode === 'signin'
                  ? 'Sign In to Tournament Hub'
                  : 'Create Account & Continue'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Enquiries & Sign-Off Footer */}
        <div className="text-center space-y-1">
          <p className="font-quicksand text-[11px] text-[#8E8E8E]">
            Enquiries: +254 10 7620304 / 0742195556
          </p>
          <p className="font-quicksand text-[11px] italic text-[#9E9E9E]/90 tracking-wide">
            Crafted by Kimathi
          </p>
        </div>
      </div>
    </div>
  );
};
