import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roles = [
  { value: 'traveler', label: 'Traveler' },
  { value: 'travel_company', label: 'Travel Company' },
  { value: 'supplier', label: 'Supplier (Hotel/Restaurant/Cruise)' },
];

export default function Register() {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '', user_type: 'traveler',
    company_name: '', supplier_name: '', business_type: 'hotel',
  });

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      // Send the user back to whatever page they were trying to reach (e.g. an invite link)
      const dest = location.state?.from;
      const redirectTo = dest ? `${dest.pathname}${dest.search || ''}` : '/';
      navigate(redirectTo, { replace: true });
    } catch {
      // surfaced via context
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        backgroundImage: 'url(/images/backgrounds/sea4.jpeg)',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {/* Register card – transparent, no shadows, no blur */}
      <div className="w-full max-w-md bg-white/40 backdrop-blur-sm rounded-xl p-8 min-h-[600px] flex flex-col justify-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Create your account</h1>
        <div className="w-16 h-1 bg-teal-500 mx-auto mb-6 rounded-full" />

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              required
              value={form.full_name}
              onChange={update('full_name')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white/90 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update('email')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white/90 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password (min 8 characters)</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={update('password')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white/90 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={update('phone')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white/90 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">I am a…</label>
            <select
              value={form.user_type}
              onChange={update('user_type')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white/90 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
            >
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {form.user_type === 'travel_company' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
              <input
                required
                value={form.company_name}
                onChange={update('company_name')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white/90 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
              />
            </div>
          )}

          {form.user_type === 'supplier' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
                <input
                  required
                  value={form.supplier_name}
                  onChange={update('supplier_name')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white/90 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business type</label>
                <select
                  value={form.business_type}
                  onChange={update('business_type')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white/90 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                >
                  <option value="hotel">Hotel</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="cruise">Cruise</option>
                  <option value="activity">Activity</option>
                </select>
              </div>
            </>
          )}

          {(form.user_type === 'travel_company' || form.user_type === 'supplier') && (
            <p className="text-xs text-gray-600 bg-gray-100/80 border border-gray-200 rounded-lg p-3">
              Company and supplier accounts require admin approval before listings can go live.
            </p>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            disabled={loading}
            type="submit"
            className="w-full py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-6 text-center">
          Already have an account? <Link to="/login" className="text-teal-600 hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}