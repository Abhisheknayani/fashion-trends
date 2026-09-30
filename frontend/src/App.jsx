import React from 'react';
import {
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import Layout from './components/Layout';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Track from './pages/Track';

import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';

import { useApp } from './context/AppContext';


/* =========================================================
   CUSTOMER GUARD
========================================================= */

function Guard({ children }) {
  const {
    user,
    loading
  } = useApp();

  if (loading) {
    return (
      <div className="loading-page">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}


/* =========================================================
   ADMIN GUARD
========================================================= */

function AdminGuard() {
  const token =
    localStorage.getItem('ft_token');

  const admin =
    localStorage.getItem('ft_admin');

  /*
   * Admin must have both:
   * 1. JWT token
   * 2. Admin information
   */

  if (!token || !admin) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  return <Admin />;
}


/* =========================================================
   APP ROUTES
========================================================= */

export default function App() {
  return (
    <Routes>

      {/* =====================================================
          CUSTOMER APPLICATION
      ===================================================== */}

      <Route element={<Layout />}>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/product/:slug"
          element={<Product />}
        />

        <Route
          path="/track"
          element={<Track />}
        />

        <Route
          path="/cart"
          element={
            <Guard>
              <Cart />
            </Guard>
          }
        />

        <Route
          path="/wishlist"
          element={
            <Guard>
              <Wishlist />
            </Guard>
          }
        />

        <Route
          path="/checkout"
          element={
            <Guard>
              <Checkout />
            </Guard>
          }
        />

        <Route
          path="/orders"
          element={
            <Guard>
              <Orders />
            </Guard>
          }
        />

        <Route
          path="/orders/:id"
          element={
            <Guard>
              <OrderDetail />
            </Guard>
          }
        />

      </Route>


      {/* =====================================================
          ADMIN APPLICATION
          
          IMPORTANT:
          These routes are OUTSIDE Layout and customer Guard.
      ===================================================== */}

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

      <Route
        path="/admin"
        element={<AdminGuard />}
      />


      {/* =====================================================
          FALLBACK
      ===================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}