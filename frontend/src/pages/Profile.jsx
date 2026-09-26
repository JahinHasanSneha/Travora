import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const dashboardByRole = {
  admin: { to: '/admin', label: 'Admin panel' },
  travel_company: { to: '/company', label: 'Company dashboard' },
  supplier: { to: '/supplier', label: 'Supplier portal' },
};

const roleLabel = {
  traveler: 'Traveler',
  travel_company: 'Travel company',
  supplier: 'Supplier',
  admin: 'Administrator',
};

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ full_name: '', phone: '', profile_picture: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const load = () => {
    client.get(`/users/${user.user_id}`).then(({ data }) => {
      setProfile(data);
      setForm({ full_name: data.full_name || '', phone: data.phone || '', profile_picture: data.profile_picture || '' });
    });
  };

  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await client.patch(`/users/${user.user_id}`, form);
      setProfile(data);
      updateUser(data);
      setEditing(false);
      setMessage({ success: true, text: 'Profile updated.' });
    } catch (err) {
      setMessage({ success: false, text: err.response?.data?.error || 'Could not update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <div className="p-8 text-center text-gray-600">Loading profile…</div>;

  const dashboard = dashboardByRole[profile.user_type];
  const initial = profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          {profile.profile_picture ? (
            <img src={profile.profile_picture} alt={profile.full_name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
              {initial}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
            <p className="text-sm text-gray-500">
              {roleLabel[profile.user_type] || profile.user_type}
              {profile.is_verified && <span className="ml-2 text-green-600 font-medium">✓ Verified</span>}
            </p>
          </div>
        </div>

        {message && (
          <p className={`text-sm mb-4 ${message.success ? 'text-green-700' : 'text-red-600'}`}>{message.text}</p>
        )}

        {!editing ? (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-900 font-medium">{profile.email}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Phone</span>
              <span className="text-gray-900 font-medium">{profile.phone || '—'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Member since</span>
              <span className="text-gray-900 font-medium">{new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Edit profile
            </button>
          </div>
        ) : (
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Full name</label>
              <input
                required
                value={form.full_name}
                onChange={update('full_name')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={update('phone')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Profile picture URL</label>
              <input
                value={form.profile_picture}
                onChange={update('profile_picture')}
                placeholder="https://…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setForm({ full_name: profile.full_name || '', phone: profile.phone || '', profile_picture: profile.profile_picture || '' }); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-6">
        <Link to="/trips" className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
          <p className="font-semibold text-gray-900">My trips</p>
          <p className="text-xs text-gray-500 mt-0.5">View and manage your custom trips</p>
        </Link>
        <Link to="/bookings" className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
          <p className="font-semibold text-gray-900">My bookings</p>
          <p className="text-xs text-gray-500 mt-0.5">Track packages and trip reservations</p>
        </Link>
        {dashboard && (
          <Link to={dashboard.to} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow sm:col-span-2">
            <p className="font-semibold text-amber-600">{dashboard.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">Manage your listings and account</p>
          </Link>
        )}
      </div>
    </div>
  );
}
