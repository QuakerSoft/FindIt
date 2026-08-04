import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import { checkIsAdmin } from "../firebase/firestore";

function AdminRoute({ children }) {
  const [accessState, setAccessState] =
    useState("loading");

  useEffect(() => {
    let isActive = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          if (isActive) {
            setAccessState("signed-out");
          }

          return;
        }

        try {
          const userIsAdmin = await checkIsAdmin(
            user.uid
          );

          if (isActive) {
            setAccessState(
              userIsAdmin ? "allowed" : "denied"
            );
          }
        } catch (error) {
          console.error(
            "Unable to verify admin access:",
            error
          );

          if (isActive) {
            setAccessState("denied");
          }
        }
      }
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  if (accessState === "loading") {
    return (
      <main className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-red-600" />

        <p className="mt-4 text-slate-600">
          Verifying admin access...
        </p>
      </main>
    );
  }

  if (accessState === "signed-out") {
    return <Navigate to="/login" replace />;
  }

  if (accessState === "denied") {
    return (
      <main className="mx-auto max-w-3xl py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-2xl font-bold text-red-900">
            Access denied
          </h1>

          <p className="mt-2 text-red-800">
            This page is only available to FindIt
            moderators.
          </p>

          <Link
            to="/"
            className="mt-5 inline-block rounded-xl bg-[#A6192E] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  return children;
}

export default AdminRoute;