import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/browse', label: 'Browse' },
    { to: '/post', label: 'Post Item' },
  ];

  return (
    <nav className="bg-[#D22030] text-white px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold">
        CSUN FindIt
      </Link>
      <div className="flex gap-6">
        <Link to="/" className="hover:text-red-200">Home</Link>
        <Link to="/browse" className="hover:text-red-200">Browse</Link>
        <Link to="/post" className="hover:text-red-200">Post Item</Link>
        <Link to="/login" className="hover:text-red-200">Login</Link>
    <nav className="sticky top-0 z-50 bg-[#A6192E] text-white px-6 py-4 shadow-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 text-xl font-bold">
          <span className="bg-white text-[#A6192E] text-xs font-extrabold px-1.5 py-0.5 rounded-sm">
            CSUN
          </span>
          <span>FindIt</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-[#A6192E]'
                    : 'text-white hover:bg-white/15'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
to="/login"
            className="ml-3 border-2 border-white text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white hover:text-[#A6192E] transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;