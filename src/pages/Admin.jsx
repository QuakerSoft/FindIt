import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase/config";
import {
  dismissModerationReport,
  getReportsForAdmin,
  hideModeratedItem,
  restoreModeratedItem,
} from "../firebase/firestore";

function Admin() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");
const [pendingAction, setPendingAction] =
    useState(null);
const [workingReportId, setWorkingReportId] =
    useState("");
const [actionError, setActionError] =
    useState("");
const [reviewFilter, setReviewFilter] =
    useState("all");

    useEffect(() => {
        async function loadReports() {
        try {
            const reportData =
            await getReportsForAdmin();

            const sortedReports = [...reportData].sort(
    (reportA, reportB) => {
        const timeA = reportA.createdAt?.toDate
        ? reportA.createdAt.toDate().getTime()
        : 0;

        const timeB = reportB.createdAt?.toDate
        ? reportB.createdAt.toDate().getTime()
        : 0;

        return timeB - timeA;
    }
    );

    setReports(sortedReports);
      } catch (error) {
        console.error(
          "Unable to load moderation reports:",
          error
        );

        setErrorMessage(
          "Unable to load flagged posts."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadReports();
  }, []);

  function requestAction(report, action) {
  setActionError("");

  setPendingAction({
    report,
    action,
  });
}

async function confirmAction() {
  if (!pendingAction) {
    return;
  }

  const currentUser = auth.currentUser;
  const { report, action } = pendingAction;

  if (!currentUser) {
    setActionError(
      "Please log in again before reviewing reports."
    );
    return;
  }

  try {
    setWorkingReportId(report.id);
    setActionError("");

    let nextStatus = report.status;

    if (action === "dismiss") {
      await dismissModerationReport(
        report.id,
        report.itemId,
        currentUser.uid
      );

      nextStatus = "dismissed";
    } else if (action === "hide") {
      await hideModeratedItem(
        report.id,
        report.itemId,
        currentUser.uid
      );

      nextStatus = "actioned";
    } else if (action === "restore") {
      await restoreModeratedItem(
        report.id,
        report.itemId,
        currentUser.uid
      );

      nextStatus = "restored";
    }

    setReports((currentReports) =>
      currentReports.map((currentReport) =>
        currentReport.id === report.id
          ? {
              ...currentReport,
              status: nextStatus,
            }
          : currentReport
      )
    );

    setPendingAction(null);
  } catch (error) {
    console.error(
      "Unable to complete moderation action:",
      error
    );

    setActionError(
      error.message ||
        "Unable to review this report."
    );
  } finally {
    setWorkingReportId("");
  }
}

const pendingReports = reports.filter(
  (report) =>
    !report.status ||
    report.status === "pending"
);

const reviewedReports = reports.filter(
  (report) =>
    report.status === "dismissed" ||
    report.status === "actioned" ||
    report.status === "restored"
);

const filteredReviewedReports =
  reviewedReports.filter((report) => {
    if (reviewFilter === "all") {
      return true;
    }

    return report.status === reviewFilter;
  });

  function formatDate(timestamp) {
    if (!timestamp?.toDate) {
      return "Date unavailable";
    }

    return timestamp.toDate().toLocaleString();
  }

  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-red-600" />

        <p className="mt-4 text-slate-600">
          Loading moderation queue...
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl py-10">
      <header className="border-b border-[#E5E0D8] pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A6192E]">
            Moderation
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1C1B19] sm:text-4xl">
            Flagged Posts
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#6B6560] sm:text-base">
            Review posts reported by members of the CSUN community.
        </p>
    </header>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {errorMessage}
        </div>
      )}

      {!errorMessage && pendingReports.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-[#D8D1C8] bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                  aria-hidden="true"
              >
                  <path d="m5 12 4 4L19 6" />
              </svg>
          </div>

          <h2 className="mt-4 text-xl font-bold text-[#1C1B19]">
              No flagged posts
          </h2>

          <p className="mt-2 text-sm text-[#6B6560]">
              The moderation queue is currently empty.
          </p>
      </div>
      )}

      {actionError && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {actionError}
        </div>
        )}

      <div className="mt-6 space-y-4">
        {pendingReports.map((report) => (
          <article
            key={report.id}
            className="rounded-2xl border border-l-4 border-[#E5E0D8] border-l-amber-400 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A6192E]">
                  {report.reason}
                </p>

                <h2 className="mt-1 text-xl font-bold text-[#1C1B19]">
                  {report.itemTitle ||
                    "Untitled report"}
                </h2>
              </div>

              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {report.status || "pending"}
              </span>
            </div>

            {report.details && (
              <div className="mt-4 rounded-xl bg-[#FAF7F2] px-4 py-3">
                <p className="text-sm font-semibold text-[#1C1B19]">
                  Reporter details
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#494541]">
                  {report.details}
                </p>
              </div>
            )}

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-slate-500">
                  Reporter email
                </dt>
                <dd className="mt-1 text-slate-900">
                  {report.reporterEmail ||
                    "Unavailable"}
                </dd>
              </div>

              <div>
                <dt className="font-medium text-slate-500">
                  Submitted
                </dt>
                <dd className="mt-1 text-slate-900">
                  {formatDate(report.createdAt)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                    to={`/items/${report.itemId}`}
                    state={{ from: "admin" }}
                    className="rounded-xl border border-[#D8D1C8] bg-white px-4 py-2 text-sm font-semibold text-[#1C1B19] transition hover:border-[#A6192E]/40 hover:bg-[#FAF7F2]"
                >
                    View Reported Post
                </Link>

                <button
                    type="button"
                    onClick={() =>
                        requestAction(report, "dismiss")
                    }
                    disabled={Boolean(workingReportId)}
                    className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Dismiss Report
                </button>

                <button
                    type="button"
                    onClick={() =>
                        requestAction(report, "hide")
                    }
                    disabled={Boolean(workingReportId)}
                    className="rounded-xl bg-[#A6192E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Hide Post
                </button>
            </div>
          </article>
        ))}
      </div>
      <section className="mt-12 border-t border-[#E5E0D8] pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-[#1C1B19]">
            Reviewed Reports
            </h2>

            <p className="mt-2 text-sm text-slate-600">
            View previous moderation decisions and restore posts that were hidden by mistake.
            </p>
        </div>

        <label className="text-sm font-medium text-slate-700">
            Filter history
            <select
            value={reviewFilter}
            onChange={(event) =>
                setReviewFilter(event.target.value)
            }
            className="mt-2 block rounded-xl border border-[#D8D1C8] bg-white px-4 py-2 text-sm text-[#1C1B19] outline-none transition focus:border-[#A6192E] focus:ring-4 focus:ring-[#A6192E]/10"
            >
            <option value="all">
                All reviewed reports
            </option>

            <option value="actioned">
                Hidden posts
            </option>

            <option value="dismissed">
                Dismissed reports
            </option>

            <option value="restored">
                Restored posts
            </option>
            </select>
        </label>
        </div>

        {filteredReviewedReports.length === 0 ? (
            <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {reviewFilter === "all"
                ? "No reports have been reviewed yet."
                : "No moderation decisions match this filter."}
            </p>
        ) : (
            <div className="mt-5 space-y-4">
            {filteredReviewedReports.map((report) => (
                <article
                key={report.id}
                className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {report.reason}
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                        {report.itemTitle || "Untitled report"}
                    </h3>
                    </div>

                    <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        report.status === "actioned"
                        ? "bg-red-100 text-red-800"
                        : report.status === "restored"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-green-100 text-green-800"
                    }`}
                    >
                    {report.status === "actioned"
                        ? "Post hidden"
                        : report.status === "restored"
                        ? "Post restored"
                        : "Report dismissed"}
                    </span>
                </div>

                <p className="mt-3 text-sm text-slate-600">
                    Submitted {formatDate(report.createdAt)}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                    to={`/items/${report.itemId}`}
                    state={{ from: "admin" }}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                    View Post
                    </Link>

                    {report.status === "actioned" && (
                    <button
                        type="button"
                        onClick={() =>
                        requestAction(report, "restore")
                        }
                        disabled={Boolean(workingReportId)}
                        className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Restore Post
                    </button>
                    )}
                </div>
                </article>
            ))}
            </div>
        )}
        </section>
      {pendingAction && (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            role="presentation"
            onClick={() => {
            if (!workingReportId) {
                setPendingAction(null);
                setActionError("");
            }
            }}
        >
            <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="moderation-action-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) =>
                event.stopPropagation()
            }
            >
            <h2
                id="moderation-action-title"
                className="text-xl font-semibold text-slate-900"
            >
                {pendingAction.action === "dismiss"
                    ? "Dismiss this report?"
                    : pendingAction.action === "restore"
                        ? "Restore this post?"
                        : "Hide this post?"}
            </h2>

            <div className="mt-3 space-y-3 text-sm text-slate-700">
                {pendingAction.action === "dismiss" ? (
                    <>
                        <p>
                            The flag against{" "}
                        <strong>
                            {pendingAction.report.itemTitle}
                        </strong>{" "}
                            will be dismissed.
                        </p>

                        <p>
                            If the post is still open, it will return to Browse.
                        </p>
                    </>
                    ) : pendingAction.action === "restore" ? (
                    <>
                        <p>
                        <strong>
                            {pendingAction.report.itemTitle}
                        </strong>{" "}
                            will become publicly visible again.
                        </p>

                        <p>
                            Previously closed requests will remain closed and will not be reopened automatically.
                        </p>

                        <p className="font-medium text-blue-700">
                            Use this only when the post was hidden by mistake.
                        </p>
                    </>
                    ) : (
                    <>
                        <p>
                        <strong>
                            {pendingAction.report.itemTitle}
                        </strong>{" "}
                            will remain hidden from Browse.
                        </p>

                        <p>
                            Any pending item requests will be closed.
                        </p>

                        <p className="font-medium text-red-700">
                            Use this when the reported post violates site rules.
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
                    disabled={Boolean(workingReportId)}
                    className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${
                        pendingAction.action === "dismiss"
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : pendingAction.action === "restore"
                            ? "bg-sky-600 hover:bg-sky-700"
                            : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                    {workingReportId
                        ? "Saving..."
                        : pendingAction.action === "dismiss"
                        ? "Yes, Dismiss Report"
                        : pendingAction.action === "restore"
                        ? "Yes, Restore Post"
                        : "Yes, Hide Post"}
                </button>

                <button
                type="button"
                onClick={() => {
                    setPendingAction(null);
                    setActionError("");
                }}
                disabled={Boolean(workingReportId)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                Cancel
                </button>
            </div>
            </section>
        </div>
        )}
    </main>
  );
}

export default Admin;