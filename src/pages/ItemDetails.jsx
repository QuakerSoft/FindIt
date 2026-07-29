import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createClaim, getItemById, getUserProfile } from "../firebase/firestore";
import ReportPost from "../components/ReportPost";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import ReportActionsMenu from "../components/ReportActionsMenu";

function ItemDetails() {
  const { itemId } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageError, setImageError] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [claimSuccess, setClaimSuccess] = useState("");
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);

  useEffect(() => {
    async function loadItem() {
      try {
        setImageError(false);
        setErrorMessage("");

        const itemData = await getItemById(itemId);

        if (!itemData) {
          setErrorMessage("This item report could not be found.");
          return;
        }

        setItem(itemData);
      } catch (error) {
        console.error(error);
        setErrorMessage("Unable to load this item report.");
      } finally {
        setIsLoading(false);
      }
    }

    loadItem();
  }, [itemId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);


  function requestClaimSubmission(event) {
    event.preventDefault();

    setClaimError("");
    setClaimSuccess("");

    if (!claimMessage.trim()) {
      setClaimError(
        "Please include identifying details or explain what you found."
      );
      return;
    }

    setShowSubmitConfirmation(true);
  }

  async function handleClaimSubmit() {
    if (!currentUser) {
      setClaimError("Please log in before submitting a request.");
      return;
    }

    if (!item) {
      setClaimError("This report is unavailable.");
      return;
    }

    if (currentUser.uid === item.ownerId) {
      setClaimError(
        "You cannot submit a request for your own report."
      );
      return;
    }

    if (item.status !== "open") {
      setClaimError(
        "This report is no longer accepting requests."
      );
      return;
    }

    const trimmedMessage = claimMessage.trim();

    if (!trimmedMessage) {
      setClaimError(
        "Please include identifying details or explain what you found."
      );
      return;
    }

    try {
      setIsSubmittingClaim(true);
      setClaimError("");
      setClaimSuccess("");

      const claimantProfile = await getUserProfile(currentUser.uid);

      if (!claimantProfile) {
        throw new Error(
          "Your profile information could not be loaded."
        );
      }

      const claimantPreference =
        claimantProfile.contactPreference || "email";

      const claimantContact = {
        preference: claimantPreference,
        email: "",
        phone: "",
      };

      if (
        claimantPreference === "email" ||
        claimantPreference === "both"
      ) {
        claimantContact.email =
          claimantProfile.email || currentUser.email || "";
      }

      if (
        claimantPreference === "phone" ||
        claimantPreference === "both"
      ) {
        claimantContact.phone =
          claimantProfile.phoneNumber || "";
      }

      await createClaim({
        itemId: item.id,
        itemTitle: item.title,
        itemType: item.type,
        requestType:
          item.type === "found"
            ? "ownership_claim"
            : "found_item",
        ownerId: item.ownerId,
        claimantId: currentUser.uid,
        claimantFirstName:
          claimantProfile.firstName || "CSUN user",
        claimantEmail: currentUser.email || "",
        claimantContact,
        message: trimmedMessage,
      });

      setClaimMessage("");
      setShowClaimForm(false);
      setShowSubmitConfirmation(false);

      setClaimSuccess(
        item.type === "found"
          ? "Your claim was submitted to the person who reported this item."
          : "Your message was sent to the person looking for this item."
      );
    } catch (error) {
      console.error("Claim submission error:", error);
      setShowSubmitConfirmation(false);

      setClaimError(
        error.message ||
          "Unable to submit your request. Please try again."
      );
    } finally {
      setIsSubmittingClaim(false);
    }
  }

  const isOwner =
    currentUser && item && currentUser.uid === item.ownerId;

  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-red-600" />

        <p className="mt-4 text-slate-600">
          Fetching item details...
        </p>
      </main>
    );
  }

  if (errorMessage || !item) {
    return (
      <main className="mx-auto max-w-3xl py-10">
        <h1 className="text-2xl font-bold text-slate-900">
          Item not found
        </h1>

        <p className="mt-2 text-slate-600">
          {errorMessage || "This item report could not be found."}
        </p>

        <Link
          to="/browse"
          className="mt-6 inline-block rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Browse
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl py-10">
      <Link
        to="/browse"
        className="text-sm font-medium text-red-600 hover:text-red-700"
      >
        ← Back to Browse
      </Link>

      <article className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
              {item.type} item
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              {item.title}
            </h1>
          </div>

          <div className="shrink-0">
            {isOwner ? (
              <ReportActionsMenu
                item={item}
                onResolved={() => {
                  setItem((currentItem) => ({
                    ...currentItem,
                    status: "resolved",
                  }));
                }}
                onDeleted={() => {
                  navigate("/browse");
                }}
              />
            ) : (
              <ReportPost item={item} />
            )}
          </div>
        </div>

        <p className="mt-4 text-slate-600">
          {item.description}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <p>
            <span className="font-semibold">Category:</span>{" "}
            {item.category}
          </p>

          <p>
            <span className="font-semibold">Status:</span>{" "}
            {item.status}
          </p>

          <p>
            <span className="font-semibold">Building:</span>{" "}
            {item.building}
          </p>

          <p>
            <span className="font-semibold">Location:</span>{" "}
            {item.location}
          </p>

          <p>
            <span className="font-semibold">
              Date lost or found:
            </span>{" "}
            {item.dateReported || "Date unavailable"}
          </p>

          <p>
            <span className="font-semibold">Reported:</span>{" "}
            {item.createdAt?.toDate
              ? item.createdAt.toDate().toLocaleDateString()
              : "Date unavailable"}
          </p>
        </div>

        {item.imageUrl && (
          <div className="mt-6">
            {imageError ? (
              <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                <p className="text-sm text-slate-600">
                  This item’s image could not be loaded.
                </p>
              </div>
            ) : (
              <img
                src={item.imageUrl}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="max-h-96 w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain p-2"
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
              />
            )}
          </div>
        )}
        {claimSuccess && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {claimSuccess}
          </div>
        )}

        {item.status === "resolved" && !isOwner && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            This report has been resolved and is no longer accepting
            responses.
          </div>
        )}

        {item.status === "open" && !isOwner && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            {!currentUser ? (
              <div>
                <p className="text-sm text-slate-600">
                  Log in to respond to this report.
                </p>

                <Link
                  to="/login"
                  className="mt-3 inline-block rounded-xl bg-[#A6192E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Log In to Respond
                </Link>
              </div>
            ) : !showClaimForm ? (
              <button
                type="button"
                onClick={() => {
                  setClaimError("");
                  setClaimSuccess("");
                  setShowClaimForm(true);
                }}
                className="rounded-xl bg-[#A6192E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                {item.type === "found"
                  ? "This Might Be Mine"
                  : "I Found This Item"}
              </button>
            ) : (
              <form
                onSubmit={requestClaimSubmission}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <h2 className="text-lg font-semibold text-slate-900">
                  {item.type === "found"
                    ? "Tell the poster why this may be yours"
                    : "Tell the poster what you found"}
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  {item.type === "found"
                    ? "Include identifying details that are not obvious from the report or image."
                    : "Explain where you found the item and include any useful identifying details."}
                </p>

                <label className="mt-4 block text-sm font-medium text-slate-700">
                  Message
                  <textarea
                    value={claimMessage}
                    onChange={(event) =>
                      setClaimMessage(event.target.value)
                    }
                    rows="5"
                    maxLength="1000"
                    placeholder={
                      item.type === "found"
                        ? "For example: Mine has a small sticker underneath that is not visible in the photo."
                        : "For example: I found an item matching this description near the library entrance."
                    }
                    className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-50"
                    required
                  />
                </label>

                <p className="mt-1 text-right text-xs text-slate-500">
                  {claimMessage.length}/1000
                </p>

                {claimError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {claimError}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={
                      isSubmittingClaim || !claimMessage.trim()
                    }
                    className="rounded-xl bg-[#A6192E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    {isSubmittingClaim
                      ? "Submitting..."
                      : "Submit Request"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowClaimForm(false);
                      setClaimMessage("");
                      setClaimError("");
                    }}
                    disabled={isSubmittingClaim}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </article>
      {showSubmitConfirmation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={() => {
            if (!isSubmittingClaim) {
              setShowSubmitConfirmation(false);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="submit-request-title"
            aria-describedby="submit-request-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="submit-request-title"
              className="text-xl font-semibold text-slate-900"
            >
              Submit this request?
            </h2>

            <div
              id="submit-request-description"
              className="mt-3 space-y-3 text-sm text-slate-700"
            >
              <p>
                The poster will see your first name and the message
                you provided.
              </p>

              <p>
                If the poster accepts, your preferred contact
                information will be shared with them, and their
                preferred contact information will be shared with you.
              </p>

              <p className="font-medium text-slate-900">
                You may only submit one request for this report, even
                if the poster rejects it.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleClaimSubmit}
                disabled={isSubmittingClaim}
                className="rounded-xl bg-[#A6192E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isSubmittingClaim
                  ? "Submitting..."
                  : "Yes, Submit Request"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowSubmitConfirmation(false)
                }
                disabled={isSubmittingClaim}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                Go Back
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default ItemDetails;