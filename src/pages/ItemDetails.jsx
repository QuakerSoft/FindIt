import {
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  checkIsAdmin,
  createClaim,
  getClaimsByOwner,
  getItemById,
  getItemMatches,
  getUserProfile,
  markItemMatchesViewed,
  getBookmarkedItemIds,
  removeItemBookmark,
  saveItemBookmark,
} from "../firebase/firestore";
import ReportPost from "../components/ReportPost";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import ReportActionsMenu from "../components/ReportActionsMenu";
import BookmarkButton from "../components/BookmarkButton";

function ItemDetails() {
  const { itemId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageError, setImageError] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [isBookmarked, setIsBookmarked] =
    useState(false);

  const [
    isUpdatingBookmark,
    setIsUpdatingBookmark,
  ] = useState(false);

  useEffect(() => {
  async function loadBookmarkStatus() {
    if (
      !currentUser ||
      !item ||
      currentUser.uid === item.ownerId
    ) {
      setIsBookmarked(false);
      return;
    }

    try {
      const bookmarkedIds =
        await getBookmarkedItemIds(
          currentUser.uid
        );

      setIsBookmarked(
        bookmarkedIds.includes(item.id)
      );
    } catch (error) {
      console.error(
        "Unable to load bookmark status:",
        error
      );

      setIsBookmarked(false);
    }
  }

  loadBookmarkStatus();
}, [currentUser, item]);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimError, setClaimError] = useState("");
  
  const [claimSuccess, setClaimSuccess] = useState("");
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [pendingClaimCount, setPendingClaimCount] = useState(0);

  const [possibleMatches, setPossibleMatches] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const matchSectionRef = useRef(null);

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
    async function loadMatches() {
      const isCurrentOwner =
        currentUser && item && currentUser.uid === item.ownerId;

      if (!isCurrentOwner) {
        setPossibleMatches([]);
        setIsLoadingMatches(false);
        return;
      }

      try {
        setIsLoadingMatches(true);
        const matches = await getItemMatches(
          item.id
        );

        setPossibleMatches(matches);

        markItemMatchesViewed(item.id).catch(
          (error) => {
            console.error(
              "Unable to mark matches as viewed:",
              error
            );
          }
        );
      } catch (error) {
        // Matches are a nice-to-have suggestion layer — never block
        // the rest of the page if this fails.
        console.error("Unable to load possible matches:", error);
        setPossibleMatches([]);
      } finally {
        setIsLoadingMatches(false);
      }
    }

    // Wait until both the item and auth state have resolved before
    // deciding whether to fetch — avoids a permission-denied read for
    // visitors who aren't the item's owner (rules restrict matches to
    // owner-only reads).
    if (item && !isAuthLoading) {
      loadMatches();
    }
  }, [item, currentUser, isAuthLoading]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        setCurrentUser(user);

        if (!user) {
          setIsAdmin(false);
          setIsAuthLoading(false);
          return;
        }

        try {
          const adminStatus = await checkIsAdmin(
            user.uid
          );

          setIsAdmin(adminStatus);
        } catch (error) {
          console.error(
            "Unable to verify administrator access:",
            error
          );

          setIsAdmin(false);
        } finally {
          setIsAuthLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    async function loadPendingClaims() {
      if (
        !currentUser ||
        !item ||
        currentUser.uid !== item.ownerId
      ) {
        setPendingClaimCount(0);
        return;
      }

      try {
        const ownerClaims = await getClaimsByOwner(
          currentUser.uid
        );

        const itemPendingClaims = ownerClaims.filter(
          (claim) =>
            claim.itemId === item.id &&
            claim.status === "pending"
        );

        setPendingClaimCount(itemPendingClaims.length);
      } catch (error) {
        console.error(
          "Unable to load pending requests:",
          error
        );
        setPendingClaimCount(0);
      }
    }

    loadPendingClaims();
  }, [currentUser, item]);

  async function toggleItemBookmark() {
  if (!currentUser) {
    navigate("/login");
    return;
  }

  if (!item || currentUser.uid === item.ownerId) {
    return;
  }

  try {
    setIsUpdatingBookmark(true);

    if (isBookmarked) {
      await removeItemBookmark(
        currentUser.uid,
        item.id
      );

      setIsBookmarked(false);
    } else {
      await saveItemBookmark(
        currentUser.uid,
        item.id
      );

      setIsBookmarked(true);
    }
  } catch (error) {
    console.error(
      "Unable to update saved item:",
      error
    );
  } finally {
    setIsUpdatingBookmark(false);
  }
}

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

  const isUnderReview =
    item?.moderationStatus === "pending_review";

  const isHidden =
    item?.moderationStatus === "hidden";

  const isUnavailable =
    item?.status === "resolved" ||
    isUnderReview ||
    isHidden;

  const canInspectUnavailableItem =
    Boolean(isOwner || isAdmin);

    useEffect(() => {
      if (
        !location.state?.scrollToMatches ||
        isLoadingMatches ||
        !isOwner ||
        isUnavailable
      ) {
        return;
      }

      const scrollTimer = window.setTimeout(() => {
        matchSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);

      return () => {
        window.clearTimeout(scrollTimer);
      };
    }, [
      location.state?.scrollToMatches,
      isLoadingMatches,
      isOwner,
      isUnavailable,
      possibleMatches.length,
    ]);

  const cameFromAccount =
    location.state?.from === "account";

  const cameFromAdmin =
    location.state?.from === "admin";

    const cameFromMatch =
      location.state?.from === "match" &&
      location.state?.returnTo;

  const backPath = cameFromMatch
    ? location.state.returnTo
    : cameFromAccount
      ? location.state?.returnTo ||
        "/account#my-reports"
      : cameFromAdmin
        ? "/admin"
        : "/browse";

  const backLabel = cameFromMatch
    ? "Back to Previous Report"
    : cameFromAccount
      ? "Back to Your Account"
      : cameFromAdmin
        ? "Back to Moderation"
        : "Back to Browse";

  const backState = cameFromMatch
    ? location.state?.returnState || {
        scrollToMatches: true,
      }
    : undefined;

  if (isLoading || isAuthLoading) {
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
          to={backPath}
          className="mt-6 inline-block rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {backLabel}
        </Link>
      </main>
    );
  }

  if (
    isUnavailable &&
    !canInspectUnavailableItem
  ) {
    return (
      <main className="mx-auto max-w-3xl py-10">
        <h1 className="text-2xl font-bold text-slate-900">
          Report unavailable
        </h1>

        <p className="mt-2 text-slate-600">
          This item report is no longer publicly available.
        </p>

        <Link
          to="/browse"
          className="mt-6 inline-block rounded-xl bg-[#A6192E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Back to Browse
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl py-6 sm:py-10">
      <Link
        to={backPath}
        state={backState}
        className="text-sm font-medium text-red-600 hover:text-red-700"
      >
        ← {backLabel}
      </Link>

      {location.state?.newlyPosted && (
        <div
          role="status"
          className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-green-900"
        >
          <p className="font-semibold">
            Item reported successfully!
          </p>

          <p className="mt-1 text-sm">
            We checked your report against existing{" "}
            {item.type === "lost" ? "found" : "lost"}{" "}
            items. Your possible matches appear below.
          </p>
        </div>
      )}

            <article className="mt-6 rounded-3xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:p-8">
        <header className="flex items-start justify-between gap-5 border-b border-[#E5E0D8] pb-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                  item.type === "found"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-[#A6192E]/20 bg-[#A6192E]/10 text-[#A6192E]"
                }`}
              >
                {item.type} item
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                  item.status === "resolved"
                    ? "border-slate-200 bg-slate-100 text-slate-600"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {item.status}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#1C1B19] sm:text-4xl">
              {item.title}
            </h1>

            <p className="mt-2 text-sm text-[#6B6560]">
              Posted by{" "}
              <span className="font-semibold text-[#1C1B19]">
                {item.ownerFirstName ||
                  "a CSUN community member"}
              </span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isOwner &&
              currentUser &&
              !isUnavailable && (
                <BookmarkButton
                  item={item}
                  isSaved={isBookmarked}
                  isWorking={isUpdatingBookmark}
                  onToggle={toggleItemBookmark}
                />
              )}
            {isOwner && !isUnavailable ? (
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
            ) : !isOwner && !isUnavailable ? (
              <ReportPost item={item} />
            ) : null}
          </div>
        </header>

        {isUnderReview && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="font-semibold text-amber-900">
              This report is under review
            </p>

            <p className="mt-1 text-sm leading-5 text-amber-800">
              It is temporarily hidden from the public
              while an administrator reviews it.
            </p>
          </div>
        )}

        {isHidden && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="font-semibold text-red-900">
              This report was removed
            </p>

            <p className="mt-1 text-sm leading-5 text-red-800">
              An administrator removed this report because
              it violated the site’s posting guidelines.
            </p>
          </div>
        )}

        {item.status === "resolved" &&
          canInspectUnavailableItem && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-100 px-5 py-4">
              <p className="font-semibold text-slate-900">
                This report is resolved
              </p>

              <p className="mt-1 text-sm leading-5 text-slate-700">
                It is no longer visible in Browse or
                accepting requests.
              </p>
            </div>
          )}

        <div className="mt-7 grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
          <div>
            <section>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A6192E]">
                Item description
              </p>

              <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-[#494541]">
                {item.description}
              </p>
            </section>

            <dl className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#FAF7F2] px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#6B6560]">
                  Category
                </dt>

                <dd className="mt-1 font-semibold text-[#1C1B19]">
                  {item.category}
                </dd>
              </div>

              <div className="rounded-2xl bg-[#FAF7F2] px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#6B6560]">
                  Campus building
                </dt>

                <dd className="mt-1 font-semibold text-[#1C1B19]">
                  {item.building}
                </dd>
              </div>

              <div className="rounded-2xl bg-[#FAF7F2] px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#6B6560]">
                  Specific location
                </dt>

                <dd className="mt-1 font-semibold text-[#1C1B19]">
                  {item.location}
                </dd>
              </div>

              <div className="rounded-2xl bg-[#FAF7F2] px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#6B6560]">
                  Date {item.type === "lost" ? "lost" : "found"}
                </dt>

                <dd className="mt-1 font-semibold text-[#1C1B19]">
                  {item.dateReported ||
                    "Date unavailable"}
                </dd>
              </div>

              <div className="rounded-2xl bg-[#FAF7F2] px-4 py-3 sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#6B6560]">
                  Report submitted
                </dt>

                <dd className="mt-1 font-semibold text-[#1C1B19]">
                  {item.createdAt?.toDate
                    ? item.createdAt
                        .toDate()
                        .toLocaleDateString()
                    : "Date unavailable"}
                </dd>
              </div>
            </dl>
          </div>

          <section>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#A6192E]">
              Item photo
            </p>

            <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FAF7F2] p-4">
              {item.imageUrl && !imageError ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="max-h-[28rem] w-full object-contain"
                  onError={() =>
                    setImageError(true)
                  }
                  onLoad={() =>
                    setImageError(false)
                  }
                />
              ) : (
                <div className="flex flex-col items-center px-6 py-12 text-center text-[#6B6560]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-12 w-12 text-[#6B6560]/60"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="16"
                      rx="2"
                    />
                    <circle
                      cx="8.5"
                      cy="9"
                      r="1.5"
                    />
                    <path d="m4 17 5-5 4 4 2-2 5 5" />
                  </svg>

                  <p className="mt-3 text-sm font-medium">
                    {imageError
                      ? "This image could not be loaded"
                      : "No image was provided"}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {isOwner && !isUnavailable && !isLoadingMatches && (
          <section
            ref={matchSectionRef}
            id="possible-matches"
            className="mt-6 scroll-mt-24 rounded-2xl border border-[#A6192E]/20 bg-[#FAF7F2] p-5"
          >
                        <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A6192E]">
                  Automatic matching
                </p>

                <h2 className="mt-1 text-xl font-bold text-[#1C1B19]">
                  Possible Matches
                </h2>

                <p className="mt-1 text-sm leading-5 text-[#6B6560]">
                  These{" "}
                  {item.type === "lost"
                    ? "found"
                    : "lost"}{" "}
                  reports share similar details with your
                  post.
                </p>
              </div>

              <span className="rounded-full border border-[#A6192E]/20 bg-white px-3 py-1 text-xs font-semibold text-[#A6192E]">
                {possibleMatches.length}{" "}
                {possibleMatches.length === 1
                  ? "match"
                  : "matches"}
              </span>
            </div>

            {possibleMatches.length > 0 ? (
              <div className="mt-4 space-y-3">
                {possibleMatches.map((match) => (
                  <Link
                    key={match.matchedItemId}
                    to={`/items/${match.matchedItemId}`}
                    state={{
                    from: "match",
                    returnTo: `/items/${item.id}`,
                    returnState: {
                      ...location.state,
                      scrollToMatches: true,
                      newlyPosted: false,
                    },
                  }}
                    className="flex flex-col gap-3 rounded-xl border border-[#E5E0D8] bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#A6192E]/40 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {match.item?.title ||
                          "Untitled report"}
                      </p>

                      <p className="text-sm text-slate-600">
                        {match.item?.category}

                        {match.item?.building
                          ? ` · ${match.item.building}`
                          : ""}
                      </p>
                    </div>

                    <span className="shrink-0 self-start rounded-full bg-[#A6192E]/10 px-3 py-1 text-xs font-bold text-[#A6192E] sm:self-auto">
                      {Math.round(match.score * 100)}% match
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-6 text-center">
                <p className="font-medium text-slate-900">
                  No strong matches yet
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  We’ll continue checking as new{" "}
                  {item.type === "lost" ? "found" : "lost"}{" "}
                  reports are posted.
                </p>
              </div>
            )}
          </section>
        )}

        {isOwner && pendingClaimCount > 0 && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="font-semibold text-amber-900">
              {pendingClaimCount === 1
                ? "1 pending request for this report"
                : `${pendingClaimCount} pending requests for this report`}
            </p>

            <p className="mt-1 text-sm text-amber-800">
              Review the request before deciding whether to share
              contact information.
            </p>

            <Link
              to="/account#received-requests"
              className="mt-3 inline-block text-sm font-semibold text-[#A6192E] hover:underline"
            >
              View Pending Requests →
            </Link>
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

        {item.status === "open" &&
          !isOwner &&
          !isUnderReview &&
          !isHidden && (
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