import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Send the user back to whatever page they were trying to reach (e.g. an invite link)
      const dest = location.state?.from;
      const redirectTo = dest ? `${dest.pathname}${dest.search || ''}` : '/';
      navigate(redirectTo, { replace: true });
    } catch {
      // error already surfaced via context
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage: 'url(/images/backgrounds/sea4.jpeg)',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {/* Login card – more transparent, no shadows, no blur */}
      <div className="w-full max-w-md bg-white/40 rounded-xl p-8 min-h-[500px] flex flex-col justify-center backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Welcome back</h1>
        <div className="w-16 h-1 bg-teal-500 mx-auto mb-6 rounded-full" />

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white/90 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white/90 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            disabled={loading}
            type="submit"
            className="w-full py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-6 text-center">
          No account? <Link to="/register" className="text-teal-600 hover:underline font-medium">Sign up</Link>
        </p>
        <p className="text-xs text-gray-500 mt-8 text-center">
          Demo: traveler@tripclone.dev / Password123! (after running the seed script)
        </p>
      </div>
    </div>
  );
}