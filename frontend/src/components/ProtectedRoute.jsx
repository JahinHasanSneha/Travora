import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Guards a route by auth + optional allowed role list (mirrors backend role-based routing)
export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  const location = useLocation();
  // Remember where the user was headed (e.g. an invite link) so Login/Register can send them back
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.user_type)) return <Navigate to="/" replace />;
  return children;
}
