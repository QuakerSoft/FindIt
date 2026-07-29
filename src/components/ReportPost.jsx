import { useState } from "react";
import { auth } from "../firebase/config";
import { createReport } from "../firebase/firestore";

const REPORT_REASONS = [
  "Suspicious or scam",
  "Inappropriate content",
  "Spam or misleading information",
  "Personal or sensitive information",
  "Other",
];

function ReportPost({ item }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wasSubmitted, setWasSubmitted] = useState(false);

  function openDialog() {
    setIsOpen(true);
    setMessage("");
    setMessageType("");
  }

  function closeDialog() {
    setIsOpen(false);
    setReason("");
    setDetails("");
    setMessage("");
    setMessageType("");
    setWasSubmitted(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setMessage("Please log in before reporting a post.");
      setMessageType("error");
      return;
    }

    if (currentUser.uid === item.ownerId) {
      setMessage("You cannot report your own post.");
      setMessageType("error");
      return;
    }

    if (!reason) {
      setMessage("Please select a reason.");
      setMessageType("error");
      return;
    }

    if (reason === "Other" && !details.trim()) {
      setMessage("Please explain why you are reporting this post.");
      setMessageType("error");
      return;
    }

    try {
      setIsSubmitting(true);

      await createReport({
        itemId: item.id,
        itemTitle: item.title,
        itemOwnerId: item.ownerId,
        reporterId: currentUser.uid,
        reporterEmail: currentUser.email || "",
        reason,
        details: details.trim(),
      });

      setMessage("Thank you. This post has been reported for review.");
      setMessageType("success");
      setWasSubmitted(true);
      setReason("");
      setDetails("");
    } catch (error) {
      console.error("Report submission error:", error);

      if (error.code === "permission-denied") {
        setMessage(
          "The report could not be saved. You may have already reported this post, or the Firestore report rules have not been published."
        );
      } else {
        setMessage("Unable to submit your report. Please try again.");
      }

      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-lg border border-black bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
      >
        Report Post
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-dialog-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="report-dialog-title"
                  className="text-xl font-bold text-black"
                >
                  Report Post
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Tell us why this post should be reviewed.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDialog}
                className="text-2xl leading-none text-black"
                aria-label="Close report form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5">
              {!wasSubmitted && (
                <>
                  <fieldset>
                    <legend className="text-sm font-semibold text-black">
                      Reason for reporting
                    </legend>

                    <div className="mt-3 space-y-3">
                      {REPORT_REASONS.map((reportReason) => (
                        <label
                          key={reportReason}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-black transition hover:border-black"
                        >
                          <input
                            type="radio"
                            name="reportReason"
                            value={reportReason}
                            checked={reason === reportReason}
                            onChange={(event) =>
                              setReason(event.target.value)
                            }
                          />

                          <span>{reportReason}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {reason === "Other" && (
                    <div className="mt-4">
                      <label
                        htmlFor="report-details"
                        className="text-sm font-semibold text-black"
                      >
                        Please explain
                      </label>

                      <textarea
                        id="report-details"
                        value={details}
                        onChange={(event) =>
                          setDetails(event.target.value)
                        }
                        maxLength={500}
                        rows={4}
                        placeholder="Describe the problem with this post"
                        className="mt-2 w-full resize-none rounded-lg border border-slate-300 p-3 text-sm text-black outline-none focus:border-black"
                      />

                      <p className="mt-1 text-right text-xs text-slate-500">
                        {details.length}/500
                      </p>
                    </div>
                  )}
                </>
              )}

              {message && (
                <p
                  role="alert"
                  className={`mt-4 rounded-lg border p-3 text-sm ${
                    messageType === "success"
                      ? "border-green-300 bg-green-50 text-green-800"
                      : "border-red-300 bg-red-50 text-red-800"
                  }`}
                >
                  {message}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                {wasSubmitted ? (
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
                  >
                    Close
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={closeDialog}
                      className="rounded-lg border border-black bg-white px-4 py-2 text-sm font-semibold text-black"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting
                        ? "Submitting..."
                        : "Submit Report"}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ReportPost;