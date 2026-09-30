import {
  Link,
  useNavigate,
  useLocation
} from 'react-router-dom';

import {
  Search,
  Heart,
  ShoppingBag,
  UserRound,
  Menu,
  X,
  LogOut,
  ShieldCheck
} from 'lucide-react';

import { useState, useEffect, useRef } from 'react';

import { useApp } from '../context/AppContext';

import './Header.css';


export default function Header() {

  const {
    user,
    cart,
    wishlist,
    logout
  } = useApp();

  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef(null);


  /* =========================================================
     HIDE CUSTOMER HEADER ON ADMIN PAGES
  ========================================================= */

  const isAdmin =
    location.pathname === '/admin' ||
    location.pathname.startsWith('/admin/');

  if (isAdmin) {
    return null;
  }


  /* =========================================================
     CLOSE ALL MENUS
  ========================================================= */

  const closeAllMenus = () => {
    setOpen(false);
    setProfileOpen(false);
  };


  /* =========================================================
     SEARCH
  ========================================================= */

  const submit = (e) => {
    e.preventDefault();

    const value = term.trim();

    if (!value) {
      navigate('/');
      closeAllMenus();
      return;
    }

    navigate(
      `/?q=${encodeURIComponent(value)}`
    );

    closeAllMenus();
  };


  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    closeAllMenus();
    logout();
  };


  /* =========================================================
     PROFILE TOGGLE
  ========================================================= */

  const toggleProfile = () => {
    setProfileOpen((current) => !current);

    // Close mobile navigation when profile opens
    setOpen(false);
  };


  /* =========================================================
     CLOSE PROFILE
  ========================================================= */

  const closeProfile = () => {
    setProfileOpen(false);
  };


  /* =========================================================
     CLOSE PROFILE WHEN CLICKING OUTSIDE
  ========================================================= */

  useEffect(() => {

    const handleOutsideClick = (event) => {

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }

    };

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };

  }, []);


  /* =========================================================
     CLOSE MENUS WHEN URL CHANGES
  ========================================================= */

  useEffect(() => {
    setOpen(false);
    setProfileOpen(false);
  }, [location.pathname, location.search]);


  return (
    <header className="header">

      <div className="header-inner">


        {/* =====================================================
            MOBILE MENU
        ===================================================== */}

        <button
          type="button"
          className="mobile-menu"
          onClick={() => {
            setOpen((current) => !current);
            setProfileOpen(false);
          }}
          aria-label={
            open
              ? 'Close menu'
              : 'Open menu'
          }
          aria-expanded={open}
        >
          {open ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>


        {/* =====================================================
            BRAND
        ===================================================== */}

        <Link
          to="/"
          className="brand"
          onClick={closeAllMenus}
          aria-label="Fashion Trends"
        >

          <span className="brand-main">
            FASHION
          </span>

          <span className="brand-sub">
            TRENDS
          </span>

        </Link>


        {/* =====================================================
            NAVIGATION
        ===================================================== */}

        <nav
          className={
            open
              ? 'nav open'
              : 'nav'
          }
          aria-label="Main navigation"
        >

          <Link
            to="/?category=men"
            onClick={closeAllMenus}
          >
            Men
          </Link>


          <Link
            to="/?category=women"
            onClick={closeAllMenus}
          >
            Women
          </Link>


          <Link
            to="/?category=kids"
            onClick={closeAllMenus}
          >
            Kids
          </Link>


          <Link
            to="/?category=home"
            onClick={closeAllMenus}
          >
            Home
          </Link>


          <Link
            to="/?category=beauty"
            onClick={closeAllMenus}
          >
            Beauty
          </Link>


          <Link
            to="/?category=genz"
            onClick={closeAllMenus}
          >
            GenZ
          </Link>


          <Link
            to="/?category=studio"
            className="studio-link"
            onClick={closeAllMenus}
          >
            Studio

            <small>
              NEW
            </small>

          </Link>

        </nav>


        {/* =====================================================
            SEARCH
        ===================================================== */}

        <form
          className="search"
          onSubmit={submit}
          role="search"
        >

          <Search
            size={18}
            aria-hidden="true"
          />

          <input
            type="search"
            value={term}
            placeholder="Search for products, brands and more"
            onChange={(e) => setTerm(e.target.value)}
            aria-label="Search products"
          />

        </form>


        {/* =====================================================
            HEADER ACTIONS
        ===================================================== */}

        <div className="header-actions">


          {/* ===================================================
              PROFILE
          =================================================== */}

          <div
            className="profile-wrapper"
            ref={profileRef}
          >

            <button
              type="button"
              className={
                profileOpen
                  ? 'action profile-action active'
                  : 'action profile-action'
              }
              onClick={toggleProfile}
              aria-label="Profile"
              aria-expanded={profileOpen}
            >

              <UserRound />

              <span>
                Profile
              </span>

            </button>


            {/* =================================================
                PROFILE DROPDOWN
            ================================================= */}

            {profileOpen && (

              <div
                className="profile-dropdown"
                role="menu"
              >


                {/* =============================================
                    PROFILE HEADER
                ============================================= */}

                <div className="profile-header">

                  <strong>
                    {user
                      ? `Welcome, ${user.name || 'User'}`
                      : 'Welcome'}
                  </strong>

                  <span>
                    {user
                      ? 'Manage your account and orders'
                      : 'To access account and manage orders'}
                  </span>


                  {!user && (

                    <Link
                      to="/login"
                      className="profile-login-button"
                      onClick={closeAllMenus}
                    >
                      LOGIN / SIGNUP
                    </Link>

                  )}

                </div>


                {/* =============================================
                    FIRST SECTION
                ============================================= */}

                <div className="profile-section">

                  <Link
                    to="/orders"
                    onClick={closeAllMenus}
                    role="menuitem"
                  >
                    Orders
                  </Link>


                  <Link
                    to="/wishlist"
                    onClick={closeAllMenus}
                    role="menuitem"
                  >
                    Wishlist
                  </Link>


                  <Link
                    to="/"
                    onClick={closeAllMenus}
                    role="menuitem"
                  >
                    Gift Cards
                  </Link>


                  <Link
                    to="/"
                    onClick={closeAllMenus}
                    role="menuitem"
                  >
                    Contact Us
                  </Link>


                  <Link
                    to="/"
                    className="insider-link"
                    onClick={closeAllMenus}
                    role="menuitem"
                  >

                    <span>
                      Fashion Insider
                    </span>

                    <small>
                      New
                    </small>

                  </Link>

                </div>


                {/* =============================================
                    SECOND SECTION
                ============================================= */}

                <div className="profile-section profile-section-last">

                  <Link
                    to="/"
                    onClick={closeAllMenus}
                    role="menuitem"
                  >
                    Fashion Credit
                  </Link>


                  <Link
                    to="/"
                    onClick={closeAllMenus}
                    role="menuitem"
                  >
                    Coupons
                  </Link>


                  <Link
                    to="/"
                    onClick={closeAllMenus}
                    role="menuitem"
                  >
                    Saved Cards
                  </Link>


                  <Link
                    to="/"
                    onClick={closeAllMenus}
                    role="menuitem"
                  >
                    Saved VPA
                  </Link>


                  <Link
                    to="/"
                    onClick={closeAllMenus}
                    role="menuitem"
                  >
                    Saved Addresses
                  </Link>

                </div>


                {/* =============================================
                    LOGOUT
                ============================================= */}

                {user && (

                  <div className="profile-section profile-logout-section">

                    <button
                      type="button"
                      className="profile-logout"
                      onClick={handleLogout}
                    >

                      <LogOut size={16} />

                      <span>
                        Logout
                      </span>

                    </button>

                  </div>

                )}

              </div>

            )}

          </div>


          {/* ===================================================
              WISHLIST
          =================================================== */}

          <Link
            to="/wishlist"
            className="action"
            onClick={closeAllMenus}
            aria-label="Wishlist"
          >

            <Heart />

            {wishlist?.length > 0 && (
              <b>
                {wishlist.length}
              </b>
            )}

            <span>
              Wishlist
            </span>

          </Link>


          {/* ===================================================
              BAG
          =================================================== */}

          <Link
            to="/cart"
            className="action"
            onClick={closeAllMenus}
            aria-label="Shopping bag"
          >

            <ShoppingBag />

            {cart?.length > 0 && (
              <b>
                {cart.length}
              </b>
            )}

            <span>
              Bag
            </span>

          </Link>

        </div>

      </div>

    </header>
  );
}


/* =========================================================
   ADMIN LINK
========================================================= */

export function AdminLink() {

  return (
    <Link
      to="/admin"
      className="admin-link"
    >

      <ShieldCheck size={16} />

      <span>
        Admin
      </span>

    </Link>
  );
}