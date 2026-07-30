import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase/config";
import { deleteItem, markItemResolved } from "../firebase/firestore";
import { createPortal } from "react-dom";

function ReportActionsMenu({
  item,
  onDeleted,
  onResolved,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [actionError, setActionError] = useState("");

  const menuRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);

        if (!isWorking) {
          setPendingAction("");
          setActionError("");
        }
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isWorking]);

  function requestAction(action) {
    setIsMenuOpen(false);
    setActionError("");
    setPendingAction(action);
  }

  async function confirmAction() {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setActionError(
        "Please log in again before managing this report."
      );
      return;
    }

    if (item.ownerId !== currentUser.uid) {
      setActionError(
        "You can only manage reports that you created."
      );
      return;
    }

    try {
      setIsWorking(true);
      setActionError("");

      if (pendingAction === "resolve") {
        if (item.status === "resolved") {
          throw new Error(
            "This report is already resolved."
          );
        }

        await markItemResolved(item.id);
        onResolved?.(item.id);
      }

      if (pendingAction === "delete") {
        await deleteItem(item.id);
        onDeleted?.(item.id);
      }

      setPendingAction("");
    } catch (error) {
      console.error("Report action error:", error);

      setActionError(
        error.message ||
          "Unable to update this report."
      );
    } finally {
      setIsWorking(false);
    }
  }

  const isResolving = pendingAction === "resolve";

  return (
    <>
      <div
        ref={menuRef}
        className="relative"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label={`Manage report: ${item.title}`}
          aria-expanded={isMenuOpen}
          onClick={() =>
            setIsMenuOpen((currentValue) => !currentValue)
          }
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl font-bold leading-none text-slate-700 shadow-sm transition hover:bg-slate-100"
        >
          <span aria-hidden="true">⋮</span>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-11 z-40 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
            <Link
              to={`/items/${item.id}/edit`}
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Edit Report
            </Link>

            {item.status === "open" && (
              <button
                type="button"
                onClick={() =>
                  requestAction("resolve")
                }
                className="block w-full px-4 py-2.5 text-left text-sm font-medium text-green-700 transition hover:bg-green-50"
              >
                Mark as Resolved
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                requestAction("delete")
              }
              className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-700 transition hover:bg-red-50"
            >
              Delete Report
            </button>
          </div>
        )}
      </div>

      {pendingAction &&
        createPortal(
            <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={() => {
            if (!isWorking) {
              setPendingAction("");
              setActionError("");
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="report-action-title"
            aria-describedby="report-action-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h2
              id="report-action-title"
              className="text-xl font-semibold text-slate-900"
            >
              {isResolving
                ? "Mark this report as resolved?"
                : "Delete this report?"}
            </h2>

            <div
              id="report-action-description"
              className="mt-3 space-y-3 text-sm text-slate-700"
            >
              {isResolving ? (
                <>
                  <p>
                    You are about to resolve{" "}
                    <strong>{item.title}</strong>.
                  </p>

                  <p>
                    Users will no longer be able to submit
                    requests for this report.
                  </p>

                  <p className="font-medium text-slate-900">
                    This action cannot currently be undone.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    You are about to permanently delete{" "}
                    <strong>{item.title}</strong>.
                  </p>

                  <p className="font-medium text-red-700">
                    This action cannot be undone.
                  </p>
                </>
              )}
            </div>

            {actionError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {actionError}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={confirmAction}
                disabled={isWorking}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${
                  isResolving
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isWorking
                  ? isResolving
                    ? "Resolving..."
                    : "Deleting..."
                  : isResolving
                    ? "Yes, Mark as Resolved"
                    : "Yes, Delete Report"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPendingAction("");
                  setActionError("");
                }}
                disabled={isWorking}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </section>
        </div>,
        document.body
      )}
    </>
  );
}

export default ReportActionsMenu;