import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";

function ProtectedRoute({ children }) {
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  if (isCheckingAuth) {
    return (
      <main className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-red-600" />
        <p className="mt-4 text-slate-600">Checking your account...</p>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }
  return children;
}

export default ProtectedRoute;