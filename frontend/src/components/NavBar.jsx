import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const dashboardByRole = {
  admin: { to: '/admin', label: 'Admin panel' },
  travel_company: { to: '/company', label: 'Company dashboard' },
  supplier: { to: '/supplier', label: 'Supplier portal' },
};

export default function NavBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dashboard = user ? dashboardByRole[user.user_type] : null;
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            {/* Brand with mirrored icon */}
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-blue-600">
              <img
                src="/images/backgrounds/sea-turtle2.png"
                alt="Travora"
                className="h-10 w-10 object-contain"
                style={{ transform: 'scaleX(-1)' }}
              />
              <span>Travora</span>
            </Link>

            <div className="hidden md:flex space-x-6">
              <Link to="/explore" className="text-gray-700 hover:text-blue-600 font-medium text-sm">
                Explore
              </Link>
              <Link to="/hotels" className="text-gray-700 hover:text-blue-600 font-medium text-sm">
                Hotels
              </Link>
              <Link to="/restaurants" className="text-gray-700 hover:text-blue-600 font-medium text-sm">
                Restaurants
              </Link>
              <Link to="/packages" className="text-gray-700 hover:text-blue-600 font-medium text-sm">
                Packages
              </Link>
              <Link to="/cruises" className="text-gray-700 hover:text-blue-600 font-medium text-sm">
                Cruises
              </Link>
              {user && (
                <>
                  <Link to="/trips" className="text-gray-700 hover:text-blue-600 font-medium text-sm">
                    My trips
                  </Link>
                  <Link to="/bookings" className="text-gray-700 hover:text-blue-600 font-medium text-sm">
                    My bookings
                  </Link>
                </>
              )}
              {dashboard && (
                <Link to={dashboard.to} className="text-amber-600 hover:text-amber-700 font-medium text-sm">
                  {dashboard.label}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Profile Icon */}
            <Link
              to={user ? '/profile' : '/login'}
              className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors"
              title={user ? 'Profile' : 'Log in / Sign up'}
            >
              {user ? (
                <span className="text-sm font-bold">{userInitial}</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </Link>

            {user ? (
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}