import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/config";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Unable to log out. Please try again.");
    }
  }

  const links = [
    { to: '/', label: 'Home' },
    { to: '/browse', label: 'Browse' },
    { to: '/post', label: 'Post Item' },
  ];

  return (
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
          {currentUser ? (
            <>
                <Link
                    to="/account"
                    aria-label="Open account"
                    className={`ml-3 flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        location.pathname === "/account"
                            ? "bg-white text-[#A6192E]"
                            : "text-white hover:bg-white/15"
                    }`}
                >
                    <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full ${
                            location.pathname === "/account"
                                ? "bg-[#A6192E] text-white"
                                : "bg-white text-[#A6192E]"
                        }`}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-4 w-4"
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 21a8 8 0 0 1 16 0" />
                        </svg>
                    </span>

                    <span>Account</span>
                </Link>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="ml-2 rounded-full border-2 border-white px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white hover:text-[#A6192E]"
                >
                    Log Out
                </button>
            </>
        ) : (
            <Link
                to="/login"
                className="ml-3 rounded-full border-2 border-white px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white hover:text-[#A6192E]"
            >
                Log In
            </Link>
        )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;