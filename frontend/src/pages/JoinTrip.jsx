import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function JoinTrip() {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('joining'); // 'joining' | 'error'
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return; // wait for ProtectedRoute / login before attempting to join
    let cancelled = false;

    client
      .post(`/trips/join-by-token/${token}`)
      .then(({ data }) => {
        if (cancelled) return;
        navigate(`/trips/${data.trip_id}`, { replace: true });
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('error');
        setError(err.response?.data?.error || 'This invite link is invalid or has already been used.');
      });

    return () => {
      cancelled = true;
    };
  }, [token, user, navigate]);

  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <h1 className="font-display text-2xl text-ink-950 mb-2">Couldn&apos;t join trip</h1>
        <p className="text-ink-700 text-sm mb-6">{error}</p>
        <Link to="/trips" className="text-amber-600 underline text-sm">Go to my trips</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center text-ink-700">
      Joining trip…
    </div>
  );
}
