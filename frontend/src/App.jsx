import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Hotels from './pages/Hotels';
import HotelDetail from './pages/HotelDetail';
import Restaurants from './pages/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import Packages from './pages/Packages';
import PackageDetail from './pages/PackageDetail';
import Cruises from './pages/Cruises';
import CruiseDetail from './pages/CruiseDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MyTrips from './pages/MyTrips';
import PublicTrips from './pages/PublicTrips';
import TripBuilder from './pages/TripBuilder';
import JoinTrip from './pages/JoinTrip';
import CostSplit from './pages/CostSplit';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import SupplierDashboard from './pages/SupplierDashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/hotels/:id" element={<HotelDetail />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/restaurants/:id" element={<RestaurantDetail />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/packages/:id" element={<PackageDetail />} />
          <Route path="/cruises" element={<Cruises />} />
          <Route path="/cruises/:id" element={<CruiseDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Traveler (any logged-in user) */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/trips" element={<ProtectedRoute><MyTrips /></ProtectedRoute>} />
          <Route path="/trips/discover" element={<ProtectedRoute><PublicTrips /></ProtectedRoute>} />
          <Route path="/trips/:id" element={<ProtectedRoute><TripBuilder /></ProtectedRoute>} />
          <Route path="/trips/:id/split" element={<ProtectedRoute><CostSplit /></ProtectedRoute>} />
          <Route path="/trips/join/:token" element={<ProtectedRoute><JoinTrip /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
          <Route path="/checkout/:bookingId" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />

          {/* Role-specific dashboards */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/company" element={<ProtectedRoute roles={['travel_company']}><CompanyDashboard /></ProtectedRoute>} />
          <Route path="/supplier" element={<ProtectedRoute roles={['supplier']}><SupplierDashboard /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}
