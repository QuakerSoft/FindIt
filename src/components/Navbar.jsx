import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import {
  checkIsAdmin,
  subscribeToClaimNotificationCount,
  subscribeToModerationNotificationCount,
  subscribeToStrongMatchNotificationCount,
} from "../firebase/firestore";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [
    claimNotificationCount,
    setClaimNotificationCount,
  ] = useState(0);

  const [
    moderationNotificationCount,
    setModerationNotificationCount,
  ] = useState(0);

  const [
    matchNotificationCount,
    setMatchNotificationCount,
  ] = useState(0);

  const notificationCount =
    claimNotificationCount +
    moderationNotificationCount +
    matchNotificationCount;
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        setCurrentUser(user);

        if (!user) {
          setIsAdmin(false);
          setClaimNotificationCount(0);
          setModerationNotificationCount(0);
          setMatchNotificationCount(0);
          return;
        }
        try {
          const userIsAdmin = await checkIsAdmin(
            user.uid
          );

          if (isActive) {
            setIsAdmin(userIsAdmin);
          }
        } catch (error) {
          console.error(
            "Unable to check admin access:",
            error
          );

          if (isActive) {
            setIsAdmin(false);
          }
        }
      }
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);
useEffect(() => {
  if (!currentUser) {
    return;
  }

  const unsubscribe =
    subscribeToClaimNotificationCount(
      currentUser.uid,
      (newNotificationCount) => {
        setClaimNotificationCount(
          newNotificationCount
        );
      },
      () => {
        setClaimNotificationCount(0);
      }
    );

  return unsubscribe;
}, [currentUser]);

useEffect(() => {
  if (!currentUser) {
    return;
  }

  const unsubscribe =
    subscribeToModerationNotificationCount(
      currentUser.uid,
      (newNotificationCount) => {
        setModerationNotificationCount(
          newNotificationCount
        );
      },
      () => {
        setModerationNotificationCount(0);
      }
    );

  return unsubscribe;
}, [currentUser]);

useEffect(() => {
  if (!currentUser) {
    return;
  }

  const unsubscribe =
    subscribeToStrongMatchNotificationCount(
      currentUser.uid,
      (newNotificationCount) => {
        setMatchNotificationCount(
          newNotificationCount
        );
      },
      (error) => {
        console.error(
          "Unable to subscribe to strong-match notifications:",
          error
        );
      }
    );

  return unsubscribe;
}, [currentUser]);

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
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    location.pathname === "/admin"
                      ? "bg-white text-[#A6192E]"
                      : "text-white hover:bg-white/15"
                  }`}
                >
                  Admin
                </Link>
              )}
                <Link
                  to={
                    moderationNotificationCount > 0 ||
                    matchNotificationCount > 0
                      ? "/account#my-reports"
                      : "/account"
                  }
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
                  {notificationCount > 0 && (
                    <span
                      aria-label={`${notificationCount} new ${
                        notificationCount === 1
                          ? "notification"
                          : "notifications"
                      }`}
                      className={`flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
                        location.pathname === "/account"
                          ? "bg-[#A6192E] text-white"
                          : "bg-amber-300 text-slate-900"
                      }`}
                    >
                      {notificationCount > 99
                        ? "99+"
                        : notificationCount}
                    </span>
                  )}
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