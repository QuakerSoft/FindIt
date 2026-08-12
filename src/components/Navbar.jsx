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
  const [navbarSearch, setNavbarSearch] =
    useState("");
  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  ] = useState(false);
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

function handleNavbarSearch(event) {
  event.preventDefault();

  const trimmedSearch = navbarSearch.trim();

  if (trimmedSearch) {
    navigate(
      `/browse?search=${encodeURIComponent(
        trimmedSearch
      )}`
    );
  } else {
    navigate("/browse");
  }

  setNavbarSearch("");
}

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
  { to: "/browse", label: "Browse" },
  { to: "/post", label: "Post Item" },
];

  return (
    <nav className="sticky top-0 z-50 bg-[#A6192E] px-4 py-3 text-white shadow-md sm:px-6">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-1.5 text-xl font-bold">
          <span className="bg-white text-[#A6192E] text-xs font-extrabold px-1.5 py-0.5 rounded-sm">
            CSUN
          </span>
          <span>FindIt</span>
        </Link>

        <form
          onSubmit={handleNavbarSearch}
          className="hidden"
          role="search"
        >
          <label
            htmlFor="navbar-search"
            className="sr-only"
          >
            Search lost and found reports
          </label>

          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>

            <input
              id="navbar-search"
              type="search"
              value={navbarSearch}
              onChange={(event) =>
                setNavbarSearch(event.target.value)
              }
              placeholder="Search items, buildings, or descriptions"
              className="w-full rounded-full border border-white/20 bg-white px-4 py-2 pl-10 text-sm text-[#1C1B19] outline-none placeholder:text-slate-400 focus:border-white focus:ring-4 focus:ring-white/20"
            />
          </div>
        </form>

        <button
          type="button"
          onClick={() =>
            setIsMobileMenuOpen(
              (currentValue) => !currentValue
            )
          }
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={
            isMobileMenuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 transition hover:bg-white/10 lg:hidden"
        >
          {isMobileMenuOpen ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M6 6 18 18" />
              <path d="M18 6 6 18" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          )}
        </button>

        <div className="hidden items-center gap-1 lg:flex">
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
            {isMobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="mx-auto mt-3 max-w-7xl border-t border-white/20 pt-3 lg:hidden"
        >
          <div className="flex flex-col gap-1">
            <Link
              to="/"
              onClick={() =>
                setIsMobileMenuOpen(false)
              }
              className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/10"
            >
              Home
            </Link>

            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() =>
                  setIsMobileMenuOpen(false)
                }
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                  location.pathname === link.to
                    ? "bg-white text-[#A6192E]"
                    : "hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {currentUser ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() =>
                      setIsMobileMenuOpen(false)
                    }
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                      location.pathname === "/admin"
                        ? "bg-white text-[#A6192E]"
                        : "hover:bg-white/10"
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
                  onClick={() =>
                    setIsMobileMenuOpen(false)
                  }
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                    location.pathname === "/account"
                      ? "bg-white text-[#A6192E]"
                      : "hover:bg-white/10"
                  }`}
                >
                  <span>Account</span>

                  {notificationCount > 0 && (
                    <span className="rounded-full bg-amber-300 px-2 py-0.5 text-xs font-bold text-slate-900">
                      {notificationCount > 99
                        ? "99+"
                        : notificationCount}
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    setIsMobileMenuOpen(false);
                    await handleLogout();
                  }}
                  className="rounded-xl px-4 py-3 text-left text-sm font-medium transition hover:bg-white/10"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() =>
                  setIsMobileMenuOpen(false)
                }
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/10"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;