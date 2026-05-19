import { ShoppingCart, Search, Heart, User, LogOut, History, X, Tag, Sun, Moon } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState(JSON.parse(localStorage.getItem('globalSearchHistory') || '[]'));
  const searchRef = useRef(null);
  
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);
  
  useEffect(() => {
    setSearchQuery('');
    setShowDropdown(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mainCategories = ['Painting', 'Jewellery', 'Pottery', 'Textiles'];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/dashboard/admin';
    if (user.role === 'ARTISAN') return '/dashboard/artisan';
    return '/dashboard/customer';
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    const term = searchQuery.trim();
    if (term) {
      const updated = [term, ...searchHistory.filter(h => h !== term)].slice(0, 5);
      setSearchHistory(updated);
      localStorage.setItem('globalSearchHistory', JSON.stringify(updated));
      navigate(`/shop?search=${encodeURIComponent(term)}`);
    } else {
      navigate(`/shop`);
    }
    setShowDropdown(false);
  };

  const selectCategory = (cat) => {
    navigate(`/shop?category=${encodeURIComponent(cat.toLowerCase())}`);
    setShowDropdown(false);
  };

  const selectHistory = (term) => {
    setSearchQuery(term);
    const updated = [term, ...searchHistory.filter(h => h !== term)].slice(0, 5);
    setSearchHistory(updated);
    localStorage.setItem('globalSearchHistory', JSON.stringify(updated));
    navigate(`/shop?search=${encodeURIComponent(term)}`);
    setShowDropdown(false);
  };

  const removeFromHistory = (e, term) => {
    e.stopPropagation();
    const updated = searchHistory.filter(h => h !== term);
    setSearchHistory(updated);
    localStorage.setItem('globalSearchHistory', JSON.stringify(updated));
  };

  const historyToShow = searchQuery.trim().length > 0 
    ? searchHistory.filter(h => h.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : searchHistory.slice(0, 5);

  const suggestedCategories = searchQuery.trim().length > 0
    ? mainCategories.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
    : mainCategories;

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-links">
          <Link to="/" className="brand-logo">Coop.</Link>
          <Link to="/shop" className="nav-link">Catalog</Link>
          <Link to="/auctions" className="nav-link">Live Auctions</Link>
        </div>
        
        <div className="nav-actions">
          <div ref={searchRef} className="search-container">
            <form onSubmit={handleSearch} style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search masterpieces..." 
                className="search-bar" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />
              <button type="submit" style={{ background: 'none', border: 'none', padding: 0 }}>
                <Search size={18} className="search-icon-btn" />
              </button>
            </form>

            {showDropdown && (suggestedCategories.length > 0 || historyToShow.length > 0) && (
              <div className="search-dropdown">
                {suggestedCategories.length > 0 && (
                  <div>
                    <div className="dropdown-section-title">Jump to Category</div>
                    {suggestedCategories.map(cat => (
                      <div 
                        key={cat} 
                        onClick={() => selectCategory(cat)}
                        className="dropdown-item"
                      >
                        <Tag size={14} style={{ color: '#888' }} />
                        <span>{cat}</span>
                      </div>
                    ))}
                  </div>
                )}

                {suggestedCategories.length > 0 && historyToShow.length > 0 && <div className="dropdown-divider"></div>}

                {historyToShow.length > 0 && (
                  <div>
                    <div className="dropdown-section-title" style={{ color: '#888' }}>Recent</div>
                    {historyToShow.map((term, i) => (
                      <div 
                        key={i} 
                        onClick={() => selectHistory(term)}
                        className="dropdown-item recent-item"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <History size={14} style={{ color: '#666' }} />
                          <span>{term}</span>
                        </div>
                        <button 
                          onClick={(e) => removeFromHistory(e, term)}
                          className="remove-history-btn"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="theme-toggle-btn"
            title={darkMode ? "Switch to Light Mode" : "Switch to Night Mode"}
          >
            {darkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          
          <Link to="/wishlist" className="nav-icon-link">
            <Heart size={24} />
          </Link>
          
          <Link to="/cart" className="nav-icon-link">
            <ShoppingCart size={24} />
          </Link>

          {user ? (
            <>
              <Link to={getDashboardLink()} className="btn btn-outline dashboard-btn">
                <User size={18} /> Dashboard
              </Link>
              <button onClick={handleLogout} className="btn logout-btn">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary signin-btn">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
