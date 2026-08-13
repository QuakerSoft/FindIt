import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";
import {
    deleteItem,
    getClaimsByClaimant,
    getClaimsByOwner,
    getUserProfile,
    getItemsByOwner,
    getUnreadStrongMatchItemIds,
    updateClaimStatus,
    updateUserProfile,
    markItemResolved,
    markReceivedClaimsViewed,
    markSubmittedClaimResponsesViewed,
    markModerationNoticesViewed,
    getBookmarkedItems,
    removeItemBookmark,
    saveItemBookmark,
} from "../firebase/firestore";
import BookmarkButton from "../components/BookmarkButton";

function ReportImage({ item }) {
    const [imageStatus, setImageStatus] =
        useState(item.imageUrl ? "loading" : "missing");

    if (
        imageStatus === "missing" ||
        imageStatus === "error"
    ) {
        return (
            <div className="mb-4 flex h-48 items-center justify-center rounded-xl bg-[#FAF7F2] px-4 text-center">
                <div>
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="mx-auto h-9 w-9 text-[#A6192E]/45"
                        aria-hidden="true"
                    >
                        <rect
                            x="3"
                            y="4"
                            width="18"
                            height="16"
                            rx="2"
                        />
                        <circle cx="8.5" cy="9" r="1.5" />
                        <path d="m4 17 5-5 4 4 2-2 5 4" />
                    </svg>

                    <p className="mt-2 text-sm font-medium text-[#6B6560]">
                        {imageStatus === "error"
                            ? "Image unavailable"
                            : "No image provided"}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative mb-4 h-48 overflow-hidden rounded-xl bg-[#FAF7F2]">
            {imageStatus === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E5E0D8] border-t-[#A6192E]" />
                </div>
            )}

            <img
                src={item.imageUrl}
                alt={item.title}
                referrerPolicy="no-referrer"
                className={`h-full w-full object-contain p-2 transition-opacity ${
                    imageStatus === "loading"
                        ? "opacity-0"
                        : "opacity-100"
                }`}
                onLoad={() => setImageStatus("loaded")}
                onError={() => setImageStatus("error")}
            />
        </div>
    );
}

function SavedItemImage({ item }) {
    const [imageFailed, setImageFailed] =
        useState(false);

    if (!item.imageUrl || imageFailed) {
        return (
            <div className="flex h-44 items-center justify-center rounded-xl bg-[#FAF7F2] px-4 text-center">
                <div>
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="mx-auto h-8 w-8 text-[#B0A8A0]"
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

                    <p className="mt-2 text-xs text-[#8A837C]">
                        No image available
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-44 overflow-hidden rounded-xl bg-[#FAF7F2]">
            <img
                src={item.imageUrl}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain p-2"
                onError={() =>
                    setImageFailed(true)
                }
            />
        </div>
    );
}

function SafeMeetupNotice() {
    return (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-900">
                Contact the other user directly
            </p>

            <p className="mt-1 text-sm text-red-800">
                FindIt does not contact either person automatically.
                Use the email address or phone number shown above to
                coordinate the item’s return.
            </p>

            <p className="mt-2 text-sm font-medium text-red-900">
                For your safety, meet in a busy public location on
                campus and let someone know where you are going.
            </p>
        </div>
    );
}

function getReportFilterFromUrl() {
    const searchParameters =
        new URLSearchParams(
            window.location.search
        );

    const requestedFilter =
        searchParameters.get("reportFilter");

    const validFilters = [
        "all",
        "active",
        "resolved",
        "moderation",
    ];

    return validFilters.includes(requestedFilter)
        ? requestedFilter
        : "all";
}

function getRequestPanelFromHash() {
    const targetId =
        window.location.hash.replace("#", "");

    if (
        targetId.startsWith("submitted-request-") ||
        targetId === "submitted-requests"
    ) {
        return "submitted";
    }

    return "received";
}

function getAccountTabFromHash() {
    const targetId =
        window.location.hash.replace("#", "");

    if (
        targetId === "received-requests" ||
        targetId === "submitted-requests" ||
        targetId.startsWith("received-request-") ||
        targetId.startsWith("submitted-request-")
    ) {
        return "requests";
    }

    if (
        targetId === "my-reports" ||
        targetId.startsWith("report-")
    ) {
        return "reports";
    }

    if (targetId === "saved-items") {
        return "saved";
    }

    return "overview";
}

function Account() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [items, setItems] = useState([]);

    const [activeTab, setActiveTab] = useState(
        getAccountTabFromHash
    );

    const [requestPanel, setRequestPanel] = useState(
        getRequestPanelFromHash
    );

    const [reportFilter, setReportFilter] =
        useState(getReportFilterFromUrl);

    const [savedItems, setSavedItems] =
        useState([]);

        const [
        workingSavedItemId,
        setWorkingSavedItemId,
        ] = useState("");

    const [unreadMatchItemIds, setUnreadMatchItemIds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    
    const [message, setMessage] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    
    const [deletingItemId, setDeletingItemId] = useState("");
    const [itemPendingDeletion, setItemPendingDeletion] = useState(null);
    const [itemPendingResolution,setItemPendingResolution,] = useState(null);

    const [resolvingItemId, setResolvingItemId] = useState("");
    const [receivedClaims, setReceivedClaims] = useState([]);
    const [submittedClaims, setSubmittedClaims] = useState([]);
    const [respondingClaimId, setRespondingClaimId] = useState("");

    const [claimPendingResponse, setClaimPendingResponse,] = useState(null);
    const [claimResponseError, setClaimResponseError] = useState("");

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [contactPreference, setContactPreference] = useState("email");
    
    function canViewPossibleMatches(item) {
        return (
            item.status === "open" &&
            item.moderationStatus === "visible"
        );
        }

    useEffect(() => {
        async function loadAccount() {
            const currentUser = auth.currentUser;

            if (!currentUser) {
                setLoadError("Please log in first.");
                setIsLoading(false);
                return;
            }

            try {
                const [
                    profileData,
                    userItems,
                    receivedClaimsData,
                    submittedClaimsData,
                    unreadStrongMatchItemIds,
                    bookmarkedItems,
                    ] = await Promise.all([
                    getUserProfile(currentUser.uid),
                    getItemsByOwner(currentUser.uid),
                    getClaimsByOwner(currentUser.uid),
                    getClaimsByClaimant(currentUser.uid),
                    getUnreadStrongMatchItemIds(
                        currentUser.uid
                        ).catch((error) => {
                        console.error(
                            "Unable to load strong-match notifications:",
                            error
                        );

                        return [];
                    }),
                    getBookmarkedItems(currentUser.uid),
                ]);

                const sortNewestFirst = (claims) =>
                    [...claims].sort((claimA, claimB) => {
                        const timeA = claimA.createdAt?.toDate
                            ? claimA.createdAt.toDate().getTime()
                            : 0;

                        const timeB = claimB.createdAt?.toDate
                            ? claimB.createdAt.toDate().getTime()
                            : 0;

                        return timeB - timeA;
                    });

                setProfile(profileData);
                setItems(userItems);
                setSavedItems(bookmarkedItems);
                setUnreadMatchItemIds(
                    unreadStrongMatchItemIds
                    );
                markModerationNoticesViewed(
                    userItems
                ).catch((error) => {
                    console.error(
                        "Unable to mark moderation notices as viewed:",
                        error
                    );
                });
                setReceivedClaims(
                sortNewestFirst(receivedClaimsData)
            );
            setSubmittedClaims(
                sortNewestFirst(submittedClaimsData)
            );

            markReceivedClaimsViewed(
                receivedClaimsData
            ).catch((error) => {
                console.error(
                    "Unable to mark received requests as viewed:",
                    error
                );
            });

            markSubmittedClaimResponsesViewed(
                submittedClaimsData
            ).catch((error) => {
                console.error(
                    "Unable to mark submitted responses as viewed:",
                    error
                );
            });

            setFirstName(profileData?.firstName || "");
                setLastName(profileData?.lastName || "");
                setPhoneNumber(profileData?.phoneNumber || "");
                setContactPreference(profileData?.contactPreference || "email");
            } catch (error) {
                console.error(error);
                setLoadError("Unable to load your account.");
            } finally {
                setIsLoading(false);
            }
        }

        loadAccount();
    }, []);
        useEffect(() => {
            function syncTabWithHash() {
            setActiveTab(getAccountTabFromHash());
            setRequestPanel(getRequestPanelFromHash());
        }

    syncTabWithHash();

    window.addEventListener(
        "hashchange",
        syncTabWithHash
    );

    return () => {
        window.removeEventListener(
            "hashchange",
            syncTabWithHash
        );
    };
}, []);

useEffect(() => {
    if (isLoading) {
        return;
    }

    const targetId =
        window.location.hash.replace("#", "");

    if (!targetId) {
        return;
    }

    const scrollTimer = window.setTimeout(() => {
        document
            .getElementById(targetId)
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
    }, 100);

    return () =>
        window.clearTimeout(scrollTimer);
}, [isLoading, activeTab, requestPanel]);

function changeAccountTab(tabName) {
    const tabHashes = {
        overview: "overview",
        reports: "my-reports",
        requests: "received-requests",
        saved: "saved-items",
    };

    setActiveTab(tabName);

    const reportFilterQuery =
        tabName === "reports" &&
        reportFilter !== "all"
            ? `?reportFilter=${reportFilter}`
            : "";

    window.history.replaceState(
        null,
        "",
        `/account${reportFilterQuery}#${tabHashes[tabName]}`
    );

    window.requestAnimationFrame(() => {
        document
            .getElementById(tabHashes[tabName])
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
    });
}

function changeRequestPanel(panelName) {
    const targetId =
        panelName === "submitted"
            ? "submitted-requests"
            : "received-requests";

    setRequestPanel(panelName);

    window.history.replaceState(
        null,
        "",
        `/account#${targetId}`
    );

    window.requestAnimationFrame(() => {
        document
            .getElementById(targetId)
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
    });
}

function changeReportFilter(filterName) {
    setReportFilter(filterName);

    const searchParameters =
        new URLSearchParams(
            window.location.search
        );

    if (filterName === "all") {
        searchParameters.delete(
            "reportFilter"
        );
    } else {
        searchParameters.set(
            "reportFilter",
            filterName
        );
    }

    const searchText =
        searchParameters.toString();

    window.history.replaceState(
        null,
        "",
        `/account${
            searchText ? `?${searchText}` : ""
        }#my-reports`
    );
}

    function formatPhoneNumber(phoneValue) {
        if (!phoneValue) {
            return "Not provided";
        }

        const digitsOnly = phoneValue.replace(/\D/g, "");

        if (digitsOnly.length !== 10) {
            return phoneValue;
        }

        return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(
            3,
            6
        )}-${digitsOnly.slice(6)}`;
    }

    function formatContactPreference(preference) {
        const preferenceLabels = {
            email: "Email",
            phone: "Phone",
            both: "Email and phone",
        };

        return preferenceLabels[preference] || "Not specified";
    }

    function formatClaimStatus(status) {
        const statusLabels = {
            pending: "Pending",
            accepted: "Accepted",
            rejected: "Rejected",
            closed: "Closed",
        };

        return statusLabels[status] || "Unknown";
    }

    function getClaimStatusStyles(status) {
        const statusStyles = {
            pending: {
                badge: "bg-amber-100 text-amber-800",
                border: "border-l-amber-400",
            },
            accepted: {
                badge: "bg-emerald-100 text-emerald-800",
                border: "border-l-emerald-500",
            },
            rejected: {
                badge: "bg-red-100 text-red-800",
                border: "border-l-red-500",
            },
            closed: {
                badge: "bg-slate-200 text-slate-700",
                border: "border-l-slate-400",
            },
        };

        return (
            statusStyles[status] || {
                badge: "bg-slate-100 text-slate-700",
                border: "border-l-slate-300",
            }
        );
    }

    function formatClaimDate(timestamp) {
        if (!timestamp?.toDate) {
            return "Date unavailable";
        }

        return timestamp.toDate().toLocaleDateString();
    }

    function getRequestLabel(claim) {
        return claim.requestType === "ownership_claim"
            ? "Ownership claim"
            : "Found-item response";
    }

    function isValidPhoneNumber(phoneValue) {
        const digitsOnly = phoneValue.replace(/\D/g, "");
        return digitsOnly.length === 10;
    }

    const isProfileUnchanged =
        firstName.trim() === (profile?.firstName || "") &&
        lastName.trim() === (profile?.lastName || "") &&
        phoneNumber.replace(/\D/g, "") ===
            (profile?.phoneNumber || "").replace(/\D/g, "") &&
        contactPreference ===
            (profile?.contactPreference || "email");

    function handleCancelEdit() {
        setFirstName(profile.firstName || "");
        setLastName(profile.lastName || "");
        setPhoneNumber(profile.phoneNumber || "");
        setContactPreference(profile.contactPreference || "email");

        setMessage("");
        setSuccessMessage("");
        setIsEditing(false);
    }

    async function handleSaveProfile(event) {
        event.preventDefault();

        const currentUser = auth.currentUser;

        if (!currentUser) {
            setMessage("Please log in again before updating your profile.");
            return;
        }

        const trimmedFirstName = firstName.trim();
        const trimmedLastName = lastName.trim();
        const trimmedPhone = phoneNumber.trim();
        const normalizedPhone = trimmedPhone.replace(/\D/g, "");

        if (!trimmedFirstName) {
            setMessage("Please enter your first name.");
            return;
        }

        if (!trimmedLastName) {
            setMessage("Please enter your last name.");
            return;
        }

        const requiresPhone =
            contactPreference === "phone" ||
            contactPreference === "both";

        if (requiresPhone && !trimmedPhone) {
            setMessage(
                "Please enter a phone number or choose Email as your contact preference."
            );
            return;
        }

        if (trimmedPhone && !isValidPhoneNumber(trimmedPhone)) {
            setMessage(
                "Please enter a valid 10-digit phone number, such as (818) 555-1234."
            );
            return;
        }

        try {
            setIsSaving(true);
            setMessage("");
            setSuccessMessage("");

            await updateUserProfile(currentUser.uid, {
                firstName: trimmedFirstName,
                lastName: trimmedLastName,
                phoneNumber: normalizedPhone,
                contactPreference,
            });

            const updatedProfile = {
                ...profile,
                firstName: trimmedFirstName,
                lastName: trimmedLastName,
                phoneNumber: normalizedPhone,
                contactPreference,
            };

            setProfile(updatedProfile);
            setIsEditing(false);
            setSuccessMessage("Profile updated successfully.");
        } catch (error) {
            console.error("Profile update error:", error);
            setMessage("Unable to update your profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    function requestItemDeletion(item) {
        const currentUser = auth.currentUser;
    
        setMessage("");
        setSuccessMessage("");

        if (!currentUser) {
            setMessage("Please log in again before deleting a report.");
            return;
        }

        if (item.ownerId !== currentUser.uid) {
            setMessage("You can only delete reports that you created.");
            return;
        }

        setItemPendingDeletion(item);
    }

    async function confirmItemDeletion() {
        if (!itemPendingDeletion) {
            return;
        }

        const currentUser = auth.currentUser;

        if (
            !currentUser ||
            itemPendingDeletion.ownerId !== currentUser.uid
        ) {
            setMessage("You can only delete reports that you created.");
            setItemPendingDeletion(null);
            return;
        }

        try {
            setDeletingItemId(itemPendingDeletion.id);
            setMessage("");
            setSuccessMessage("");

            await deleteItem(itemPendingDeletion.id);

            setItems((currentItems) =>
                currentItems.filter(
                    (currentItem) =>
                        currentItem.id !== itemPendingDeletion.id
                )
            );

            setSuccessMessage(
                `"${itemPendingDeletion.title}" was deleted successfully.`
            );

            setItemPendingDeletion(null);
        } catch (error) {
            console.error("Item deletion error:", error);
            setMessage("Unable to delete this report. Please try again.");
        } finally {
            setDeletingItemId("");
        }
    }

    function requestItemResolution(item) {
        const currentUser = auth.currentUser;

        setMessage("");
        setSuccessMessage("");

        if (!currentUser) {
            setMessage(
                "Please log in again before resolving a report."
            );
            return;
        }

        if (item.ownerId !== currentUser.uid) {
            setMessage(
                "You can only resolve reports that you created."
            );
            return;
        }

        if (item.status === "resolved") {
            setMessage("This report is already resolved.");
            return;
        }

        setItemPendingResolution(item);
    }

    async function confirmItemResolution() {
        if (!itemPendingResolution) {
            return;
        }

        const currentUser = auth.currentUser;

        if (
            !currentUser ||
            itemPendingResolution.ownerId !== currentUser.uid
        ) {
            setMessage(
                "You can only resolve reports that you created."
            );
            setItemPendingResolution(null);
            return;
        }

        try {
            setResolvingItemId(itemPendingResolution.id);
            setMessage("");
            setSuccessMessage("");

            await markItemResolved(
                itemPendingResolution.id,
                currentUser.uid
            );

            setItems((currentItems) =>
                currentItems.map((currentItem) =>
                    currentItem.id ===
                    itemPendingResolution.id
                        ? {
                            ...currentItem,
                            status: "resolved",
                        }
                        : currentItem
                )
            );

            setSuccessMessage(
                `"${itemPendingResolution.title}" was marked as resolved.`
            );

            setItemPendingResolution(null);
        } catch (error) {
            console.error(
                "Item resolution error:",
                error
            );

            setMessage(
                "Unable to resolve this report. Please try again."
            );
        } finally {
            setResolvingItemId("");
        }
    }

    function requestClaimResponse(claim, newStatus) {
        setMessage("");
        setSuccessMessage("");
        setClaimResponseError("");

        setClaimPendingResponse({
            claim,
            newStatus,
        });
    }

    function buildOwnerContact() {
        const currentUser = auth.currentUser;
        const preference =
            profile.contactPreference || "email";

        const ownerContact = {
            preference,
            email: "",
            phone: "",
        };

        if (
            preference === "email" ||
            preference === "both"
        ) {
            ownerContact.email =
                profile.email || currentUser?.email || "";
        }

        if (
            preference === "phone" ||
            preference === "both"
        ) {
            ownerContact.phone = profile.phoneNumber || "";
        }

        return ownerContact;
    }

    async function handleClaimResponse(claim, newStatus) {
        const currentUser = auth.currentUser;

        setMessage("");
        setSuccessMessage("");
        setClaimResponseError("");

        if (!currentUser) {
            setClaimResponseError(
                "Please log in again before responding."
            );
            return;
        }

        if (claim.ownerId !== currentUser.uid) {
            setClaimResponseError(
                "Only the report owner can respond to this request."
            );
            return;
        }

        if (claim.status !== "pending") {
            setClaimResponseError(
                "This request has already been reviewed."
            );
            return;
        }

        try {
            setRespondingClaimId(claim.id);

            const ownerContact =
                newStatus === "accepted"
                    ? buildOwnerContact()
                    : null;

            await updateClaimStatus(
                claim.id,
                newStatus,
                ownerContact
            );

            setReceivedClaims((currentClaims) =>
                currentClaims.map((currentClaim) =>
                    currentClaim.id === claim.id
                        ? {
                            ...currentClaim,
                            status: newStatus,
                            ownerContact,
                        }
                        : currentClaim
                )
            );

            setClaimPendingResponse(null);

            setSuccessMessage(
                newStatus === "accepted"
                    ? `You accepted ${claim.claimantFirstName || "the claimant"}'s request for "${claim.itemTitle}".`
                    : `You rejected ${claim.claimantFirstName || "the claimant"}'s request for "${claim.itemTitle}".`
            );
        } catch (error) {
            console.error("Claim response error:", error);

            setClaimResponseError(
                error.message ||
                    "Unable to respond to this request."
            );
        } finally {
            setRespondingClaimId("");
        }
    }

    async function toggleSavedItem(item) {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            return;
        }

        const isCurrentlySaved = savedItems.some(
            (savedItem) => savedItem.id === item.id
        );

        try {
            setWorkingSavedItemId(item.id);

            if (isCurrentlySaved) {
            await removeItemBookmark(
                currentUser.uid,
                item.id
            );

            setSavedItems((currentItems) =>
                currentItems.filter(
                (savedItem) =>
                    savedItem.id !== item.id
                )
            );
            } else {
            await saveItemBookmark(
                currentUser.uid,
                item.id
            );

            setSavedItems((currentItems) => [
                ...currentItems,
                item,
            ]);
            }
        } catch (error) {
            console.error(
            "Unable to update saved item:",
            error
            );

            setMessage(
            "Unable to update your saved items."
            );
        } finally {
            setWorkingSavedItemId("");
        }
        }

    if (isLoading) {
        return (
            <main className="flex flex-col items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-red-600" />

                <p className="mt-4 text-slate-600">
                    Loading account...
                </p>
            </main>
        );
    }

    if (loadError) {
        return (
            <main className="mx-auto max-w-5xl py-12">
                {loadError}
            </main>
        );
    }

    if (!profile) {
        return (
            <main className="mx-auto max-w-5xl py-12">
                Profile information is unavailable.
            </main>
        );
    }

    const activeReports = items.filter(
    (item) =>
        item.status === "open" &&
        item.moderationStatus === "visible"
);

const resolvedReports = items.filter(
    (item) => item.status === "resolved"
);

const moderatedReports = items.filter(
    (item) =>
        item.moderationStatus ===
            "pending_review" ||
        item.moderationStatus === "hidden"
);

const activeReportCount =
    activeReports.length;

const resolvedReportCount =
    resolvedReports.length;

const pendingReceivedRequestCount =
    receivedClaims.filter(
        (claim) => claim.status === "pending"
    ).length;

const filteredReports =
    reportFilter === "active"
        ? activeReports
        : reportFilter === "resolved"
          ? resolvedReports
          : reportFilter === "moderation"
            ? moderatedReports
            : items;

    return (
        <main className="pt-3 mx-auto max-w-5xl py-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A6192E]">
                        Account dashboard
                    </p>

                    <h1 className="mt-2 text-3xl font-bold text-[#1C1B19] sm:text-4xl">
                        Welcome back, {profile.firstName}
                    </h1>

                    <p className="mt-2 text-sm text-[#6B6560]">
                        Manage your reports, requests, saved items, and profile.
                    </p>
                </div>

                <Link
                    to="/post"
                    className="rounded-xl bg-[#A6192E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
                >
                    Post an Item
                </Link>
            </div>

            {successMessage && (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {successMessage}
                </div>
            )}

            {message && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {message}
                </div>
            )}

            <nav
                aria-label="Account sections"
                className="mt-8 grid grid-cols-2 gap-2 rounded-2xl border border-[#E5E0D8] bg-white p-2 shadow-sm md:grid-cols-4"
            >
                {[
                    {
                        id: "overview",
                        label: "Overview",
                        count: null,
                    },
                    {
                        id: "reports",
                        label: "My Reports",
                        count: items.length,
                    },
                    {
                        id: "requests",
                        label: "Requests",
                        count:
                            receivedClaims.length +
                            submittedClaims.length,
                    },
                    {
                        id: "saved",
                        label: "Saved Items",
                        count: savedItems.length,
                    },
                ].map((tab) => {
                    const isActive =
                        activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() =>
                                changeAccountTab(tab.id)
                            }
                            aria-current={
                                isActive ? "page" : undefined
                            }
                            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                                isActive
                                    ? "bg-[#A6192E] text-white shadow-sm"
                                    : "text-[#6B6560] hover:bg-[#FAF7F2] hover:text-[#1C1B19]"
                            }`}
                        >
                            <span>{tab.label}</span>

                            {tab.count !== null && (
                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs ${
                                        isActive
                                            ? "bg-white/20 text-white"
                                            : "bg-[#F1ECE5] text-[#6B6560]"
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            <section
                id="overview"
                className={
                    activeTab === "overview"
                        ? "block scroll-mt-24"
                        : "hidden"
                }
            >

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <button
                        type="button"
                        onClick={() =>
                            changeAccountTab("reports")
                        }
                        className="rounded-2xl border border-[#E5E0D8] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#A6192E]/40 hover:shadow-md"
                    >
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B6560]">
                            Total posted
                        </p>

                        <p className="mt-3 text-3xl font-bold text-[#1C1B19]">
                            {items.length}
                        </p>

                        <p className="mt-1 text-sm text-[#6B6560]">
                            View all your reports
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            changeAccountTab("reports")
                        }
                        className="rounded-2xl border border-[#E5E0D8] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B6560]">
                                Active
                            </p>

                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        </div>

                        <p className="mt-3 text-3xl font-bold text-[#1C1B19]">
                            {activeReportCount}
                        </p>

                        <p className="mt-1 text-sm text-[#6B6560]">
                            Publicly visible reports
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            changeAccountTab("requests")
                        }
                        className="rounded-2xl border border-[#E5E0D8] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B6560]">
                                Pending requests
                            </p>

                            {pendingReceivedRequestCount > 0 && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                    New
                                </span>
                            )}
                        </div>

                        <p className="mt-3 text-3xl font-bold text-[#1C1B19]">
                            {pendingReceivedRequestCount}
                        </p>

                        <p className="mt-1 text-sm text-[#6B6560]">
                            Waiting for your response
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            changeAccountTab("saved")
                        }
                        className="rounded-2xl border border-[#E5E0D8] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#A6192E]/40 hover:shadow-md"
                    >
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B6560]">
                            Saved items
                        </p>

                        <p className="mt-3 text-3xl font-bold text-[#1C1B19]">
                            {savedItems.length}
                        </p>

                        <p className="mt-1 text-sm text-[#6B6560]">
                            Reports you bookmarked
                        </p>
                    </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5E0D8] bg-[#FAF7F2] px-5 py-4">
                    <div>
                        <p className="font-semibold text-[#1C1B19]">
                            {resolvedReportCount}{" "}
                            {resolvedReportCount === 1
                                ? "report has"
                                : "reports have"}{" "}
                            been resolved
                        </p>

                        <p className="mt-1 text-sm text-[#6B6560]">
                            Resolved reports remain available in My Reports for your records.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            changeAccountTab("reports")
                        }
                        className="text-sm font-semibold text-[#A6192E] hover:underline"
                    >
                        View report history →
                    </button>
                </div>

            {isEditing ? (
                <form onSubmit={handleSaveProfile} className="justify-center rounded-3xl bg-white border border-slate-200 p-6 shadow-sm sm:p-8 mt-6 max-w-xl">
                    <label className="font-semibold text-lg">
                        Make changes to your account.
                    </label>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="text-sm font-medium pt-5">
                            First name
                            <input
                                type="text"
                                value={firstName}
                                onChange={(event) => setFirstName(event.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                                required
                            />
                        </label>

                        <label className="text-sm font-medium pt-5">
                            Last name
                            <input
                                type="text"
                                value={lastName}
                                onChange={(event) => setLastName(event.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                                required
                            />
                        </label>
                    </div>

                    <label className="mt-5 block text-sm font-medium">
                        Phone number
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(event) => setPhoneNumber(event.target.value)}
                            inputMode="tel"
                            maxLength="14"
                            placeholder="e.g., (818) 555-1234"
                            required={
                                contactPreference === "phone" ||
                                contactPreference === "both"
                            }
                            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                        />
                    </label>

                    <label className="mt-5 block text-sm font-medium">
                        Contact preference
                        <select
                            value={contactPreference}
                            onChange={(event) =>
                                setContactPreference(event.target.value)
                            }
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                        >
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="both">Email & Phone</option>
                        </select>
                    </label>

                    <div className="mt-6 flex gap-3">
                        <button
                            type="submit"
                            disabled={isSaving || isProfileUnchanged}
                            className="rounded-xl border border-transparent bg-[#A6192E] px-5 py-2.5 font-semibold text-white transition hover:bg-white hover:text-[#A6192E] hover:border-[#A6192E] disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:border-slate-300 disabled:hover:bg-slate-300 disabled:hover:text-slate-500"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>

                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold transition hover:bg-slate-100"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <section className="mt-8 max-w-2xl">
                    <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-sm">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A6192E]">
                                Personal information
                            </p>

                            <h2 className="mt-1 text-xl font-bold text-[#1C1B19]">
                                Profile Information
                            </h2>

                            <p className="mt-1 text-sm text-[#6B6560]">
                                Your contact preferences are shared only when an item request is accepted.
                            </p>
                        </div>

                        <dl className="mt-4 space-y-4">
                            <div>
                                <dt className="text-sm font-medium text-slate-500">
                                    Email
                                </dt>
                                <dd className="mt-1 text-slate-900">
                                    {profile.email}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-slate-500">
                                    Account type
                                </dt>
                                <dd className="mt-1 capitalize text-slate-900">
                                    {profile.role || "Not specified"}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-slate-500">
                                    Preferred contact method
                                </dt>
                                <dd className="mt-1 text-slate-900">
                                    {formatContactPreference(
                                        profile.contactPreference
                                    )}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-slate-500">
                                    Phone number
                                </dt>
                                <dd className="mt-1 text-slate-900">
                                    {formatPhoneNumber(profile.phoneNumber)}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setMessage("");
                            setSuccessMessage("");
                            setIsEditing(true);
                        }}
                        className="mt-7 rounded-xl bg-[#A6192E] px-7 py-2.5 font-semibold text-white border border-transparent transition hover:bg-white hover:text-[#A6192E] hover:border-[#A6192E]"
                    >
                        Edit Profile
                    </button>
                </section>
            )}
            
            </section>

            <section
                className={
                    activeTab === "requests"
                        ? "mt-8 block"
                        : "hidden"
                }
            >
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A6192E]">
                            Request center
                        </p>

                        <h2 className="mt-1 text-2xl font-bold text-[#1C1B19]">
                            Item Requests
                        </h2>

                        <p className="mt-2 text-sm text-[#6B6560]">
                            Review requests you received and track requests you submitted.
                        </p>
                    </div>

                    <Link
                        to="/browse"
                        className="text-sm font-semibold text-[#A6192E] hover:underline"
                    >
                        Browse open reports →
                    </Link>
                </div>

                <div className="mt-5 inline-flex w-full rounded-2xl border border-[#E5E0D8] bg-white p-1.5 shadow-sm sm:w-auto">
                    <button
                        type="button"
                        onClick={() =>
                            changeRequestPanel("received")
                        }
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition sm:flex-none ${
                            requestPanel === "received"
                                ? "bg-[#A6192E] text-white"
                                : "text-[#6B6560] hover:bg-[#FAF7F2]"
                        }`}
                    >
                        <span>Received</span>

                        <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                                requestPanel === "received"
                                    ? "bg-white/20 text-white"
                                    : "bg-[#F1ECE5] text-[#6B6560]"
                            }`}
                        >
                            {receivedClaims.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            changeRequestPanel("submitted")
                        }
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition sm:flex-none ${
                            requestPanel === "submitted"
                                ? "bg-[#A6192E] text-white"
                                : "text-[#6B6560] hover:bg-[#FAF7F2]"
                        }`}
                    >
                        <span>Submitted</span>

                        <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                                requestPanel === "submitted"
                                    ? "bg-white/20 text-white"
                                    : "bg-[#F1ECE5] text-[#6B6560]"
                            }`}
                        >
                            {submittedClaims.length}
                        </span>
                    </button>
                </div>
            </section>

            <section
                id="received-requests"
                className={`scroll-mt-24 ${
                    activeTab === "requests" &&
                    requestPanel === "received"
                        ? "mt-6 block"
                        : "hidden"
                }`}
            >
                <h3 className="text-xl font-bold text-[#1C1B19]">
                    Requests Received
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                    Review responses submitted for your lost and found reports.
                </p>

                {receivedClaims.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-dashed border-[#E5E0D8] bg-white px-6 py-10 text-center">
                        <p className="font-semibold text-[#1C1B19]">
                            No requests received
                        </p>

                        <p className="mt-1 text-sm text-[#6B6560]">
                            Requests from other users will appear here when they respond to one of your reports.
                        </p>
                    </div>
                ) : (
                    <div className="mt-5 space-y-4">
                        {receivedClaims.map((claim) => (
                            <article
                                key={claim.id}
                                id={`received-request-${claim.id}`}
                                className={`scroll-mt-24 rounded-2xl border border-l-4 border-[#E5E0D8] bg-white p-5 shadow-sm transition hover:shadow-md ${
                                    getClaimStatusStyles(claim.status).border
                                }`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A6192E]">
                                            {getRequestLabel(claim)}
                                        </p>

                                        <h3 className="mt-1 truncate text-lg font-bold text-[#1C1B19]">
                                            {claim.itemTitle}
                                        </h3>

                                        <p className="mt-2 text-sm text-[#6B6560]">
                                            Request from{" "}
                                            <span className="font-semibold text-[#1C1B19]">
                                                {claim.claimantFirstName || "a CSUN user"}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {claim.ownerViewed === false && (
                                            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                                                New request
                                            </span>
                                        )}

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                getClaimStatusStyles(claim.status).badge
                                            }`}
                                        >
                                            {formatClaimStatus(claim.status)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-xl bg-[#FAF7F2] px-4 py-3">
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B6560]">
                                        Claimant message
                                    </p>

                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1C1B19]">
                                        {claim.message}
                                    </p>
                                </div>

                                <p className="mt-3 flex items-center gap-1.5 text-xs text-[#6B6560]">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    >
                                        <circle cx="12" cy="12" r="9" />
                                        <path d="M12 7v5l3 2" />
                                    </svg>

                                    Submitted {formatClaimDate(claim.createdAt)}
                                </p>

                                {claim.status === "pending" && (
                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                requestClaimResponse(
                                                    claim,
                                                    "accepted"
                                                )
                                            }
                                            disabled={Boolean(respondingClaimId)}
                                            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {respondingClaimId === claim.id
                                                ? "Saving..."
                                                : "Accept Request"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                requestClaimResponse(
                                                    claim,
                                                    "rejected"
                                                )
                                            }
                                            disabled={Boolean(respondingClaimId)}
                                            className="rounded-xl border border-[#A6192E]/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#A6192E] transition hover:bg-[#A6192E]/5 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {respondingClaimId === claim.id
                                                ? "Saving..."
                                                : "Reject Request"}
                                        </button>
                                    </div>
                                )}

                                {claim.status === "accepted" && (
                                    <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                                        <p className="text-sm font-semibold text-green-900">
                                            Claimant contact information
                                        </p>

                                        {claim.claimantContact?.email && (
                                            <p className="mt-2 text-sm text-green-800">
                                                Email: {claim.claimantContact.email}
                                            </p>
                                        )}

                                        {claim.claimantContact?.phone && (
                                            <p className="mt-1 text-sm text-green-800">
                                                Phone:{" "}
                                                {formatPhoneNumber(
                                                    claim.claimantContact.phone
                                                )}
                                            </p>
                                        )}

                                        {!claim.claimantContact && claim.claimantEmail && (
                                            <p className="mt-2 text-sm text-green-800">
                                                Email: {claim.claimantEmail}
                                            </p>
                                        )}
                                        <SafeMeetupNotice />
                                    </div>
                                )}

                                <Link
                                    to={`/items/${claim.itemId}`}
                                    state={{
                                        from: "account",
                                        returnTo: `/account#received-request-${claim.id}`,
                                    }}
                                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#A6192E] transition hover:text-red-800 hover:underline"
                                >
                                    View related report
                                    <span aria-hidden="true">→</span>
                                </Link>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section
                id="submitted-requests"
                className={`scroll-mt-24 ${
                    activeTab === "requests" &&
                    requestPanel === "submitted"
                        ? "mt-6 block"
                        : "hidden"
                }`}
            >
                <h3 className="text-xl font-bold text-[#1C1B19]">
                    Requests You Submitted
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                    Track the status of requests you've sent to other users.
                </p>

                {submittedClaims.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-dashed border-[#E5E0D8] bg-white px-6 py-10 text-center">
                        <p className="font-semibold text-[#1C1B19]">
                            No submitted requests
                        </p>

                        <p className="mt-1 text-sm text-[#6B6560]">
                            When you contact the poster of a lost or found item, your request will appear here.
                        </p>

                        <Link
                            to="/browse"
                            className="mt-4 inline-block text-sm font-semibold text-[#A6192E] hover:underline"
                        >
                            Browse reports →
                        </Link>
                    </div>
                ) : (
                    <div className="mt-5 space-y-4">
                        {submittedClaims.map((claim) => (
                            <article
                                key={claim.id}
                                id={`submitted-request-${claim.id}`}
                                className={`scroll-mt-24 rounded-2xl border border-l-4 border-[#E5E0D8] bg-white p-5 shadow-sm transition hover:shadow-md ${
                                    getClaimStatusStyles(claim.status).border
                                }`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A6192E]">
                                            {getRequestLabel(claim)}
                                        </p>

                                        <h3 className="mt-1 truncate text-lg font-bold text-[#1C1B19]">
                                            {claim.itemTitle}
                                        </h3>

                                        <p className="mt-2 text-sm text-[#6B6560]">
                                            Request submitted by{" "}
                                            <span className="font-semibold text-[#1C1B19]">
                                                you
                                            </span>
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {claim.status !== "pending" &&
                                            claim.claimantViewedResponse === false && (
                                                <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                                                    New response
                                                </span>
                                            )}

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                getClaimStatusStyles(claim.status).badge
                                            }`}
                                        >
                                            {formatClaimStatus(claim.status)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-xl bg-[#FAF7F2] px-4 py-3">
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B6560]">
                                        Your message
                                    </p>

                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1C1B19]">
                                        {claim.message}
                                    </p>
                                </div>

                                <p className="mt-3 flex items-center gap-1.5 text-xs text-[#6B6560]">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    >
                                        <circle cx="12" cy="12" r="9" />
                                        <path d="M12 7v5l3 2" />
                                    </svg>

                                    Submitted {formatClaimDate(claim.createdAt)}
                                </p>

                                {claim.status === "pending" && (
                                    <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                        Waiting for the poster to review your request.
                                    </p>
                                )}

                                {claim.status === "rejected" && (
                                    <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                        The poster did not approve this request.
                                    </p>
                                )}

                                {claim.status === "closed" && (
                                    <p className="mt-4 rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-700">
                                        {claim.closedReason === "moderation"
                                            ? "This request was closed because an administrator removed the item report."
                                            : "This report was marked as resolved before your request was accepted."}
                                    </p>
                                )}

                                {claim.status === "accepted" &&
                                    claim.ownerContact && (
                                        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                                            <p className="text-sm font-semibold text-green-900">
                                                Poster contact information
                                            </p>

                                            {claim.ownerContact.email && (
                                                <p className="mt-2 text-sm text-green-800">
                                                    Email:{" "}
                                                    {claim.ownerContact.email}
                                                </p>
                                            )}

                                            {claim.ownerContact.phone && (
                                                <p className="mt-1 text-sm text-green-800">
                                                    Phone:{" "}
                                                    {formatPhoneNumber(
                                                        claim.ownerContact.phone
                                                    )}
                                                </p>
                                            )}
                                            <SafeMeetupNotice />
                                        </div>
                                    )}

                                <Link
                                    to={`/items/${claim.itemId}`}
                                    state={{
                                        from: "account",
                                        returnTo: `/account#submitted-request-${claim.id}`,
                                    }}
                                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#A6192E] transition hover:text-red-800 hover:underline"
                                >
                                    View related report
                                    <span aria-hidden="true">→</span>
                                </Link>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {claimPendingResponse && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="presentation"
                    onClick={() => {
                        if (!respondingClaimId) {
                            setClaimPendingResponse(null);
                            setClaimResponseError("");
                        }
                    }}
                >
                    <section
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="claim-response-title"
                        aria-describedby="claim-response-description"
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h2
                            id="claim-response-title"
                            className="text-xl font-semibold text-slate-900"
                        >
                            {claimPendingResponse.newStatus === "accepted"
                                ? `Accept ${claimPendingResponse.claim.claimantFirstName || "this user"}'s request?`
                                : `Reject ${claimPendingResponse.claim.claimantFirstName || "this user"}'s request?`}
                        </h2>

                        <div
                            id="claim-response-description"
                            className="mt-3 space-y-3 text-sm text-slate-700"
                        >
                            {claimPendingResponse.newStatus ===
                            "accepted" ? (
                                <>
                                    <p>
                                        Your preferred contact information
                                        will be shared with{" "}
                                        {claimPendingResponse.claim
                                            .claimantFirstName ||
                                            "the claimant"}.
                                    </p>

                                    <p>
                                        Their preferred contact information
                                        will also be shared with you so you
                                        can coordinate the return of the
                                        item.
                                    </p>

                                    <p className="font-medium text-slate-900">
                                        This decision cannot be undone.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p>
                                        No contact information will be
                                        shared.
                                    </p>

                                    <p>
                                        {claimPendingResponse.claim
                                            .claimantFirstName ||
                                            "The claimant"}{" "}
                                        will not be able to submit another
                                        request for this report.
                                    </p>

                                    <p className="font-medium text-slate-900">
                                        This decision cannot be undone.
                                    </p>
                                </>
                            )}
                        </div>

                        {claimResponseError && (
                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                {claimResponseError}
                            </div>
                        )}

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    handleClaimResponse(
                                        claimPendingResponse.claim,
                                        claimPendingResponse.newStatus
                                    )
                                }
                                disabled={Boolean(respondingClaimId)}
                                className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${
                                    claimPendingResponse.newStatus ===
                                    "accepted"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-red-600 hover:bg-red-700"
                                }`}
                            >
                                {respondingClaimId
                                    ? "Saving..."
                                    : claimPendingResponse.newStatus ===
                                        "accepted"
                                    ? "Yes, Accept and Share Contact"
                                    : "Yes, Reject Request"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setClaimPendingResponse(null);
                                    setClaimResponseError("");
                                }}
                                disabled={Boolean(respondingClaimId)}
                                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                            >
                                Cancel
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {itemPendingResolution && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="presentation"
                    onClick={() => {
                        if (!resolvingItemId) {
                            setItemPendingResolution(null);
                        }
                    }}
                >
                    <section
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="resolve-report-title"
                        aria-describedby="resolve-report-description"
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <h2
                            id="resolve-report-title"
                            className="text-xl font-semibold text-slate-900"
                        >
                            Mark this report as resolved?
                        </h2>

                        <div
                            id="resolve-report-description"
                            className="mt-3 space-y-3 text-sm text-slate-700"
                        >
                            <p>
                                You are about to resolve{" "}
                                <strong>
                                    {itemPendingResolution.title}
                                </strong>
                                .
                            </p>

                            <p>
                                Users will no longer be able to submit
                                requests for this report.
                            </p>

                            <p>
                                Any pending requests will be closed, and those
                                users will be notified that the report was resolved.
                            </p>

                            <p className="font-medium text-slate-900">
                                This action cannot currently be undone.
                            </p>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={confirmItemResolution}
                                disabled={Boolean(resolvingItemId)}
                                className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                            >
                                {resolvingItemId
                                    ? "Resolving..."
                                    : "Yes, Mark as Resolved"}
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setItemPendingResolution(null)
                                }
                                disabled={Boolean(resolvingItemId)}
                                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                            >
                                Cancel
                            </button>
                        </div>
                    </section>
                </div>
            )}
            
            {itemPendingDeletion && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="presentation"
                    onClick={() => {
                        if (!deletingItemId) {
                            setItemPendingDeletion(null);
                        }
                    }}
                >
                    <section
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-report-title"
                        aria-describedby="delete-report-description"
                        className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h2
                            id="delete-report-title"
                            className="text-lg font-semibold text-red-900"
                        >
                            Delete this report?
                        </h2>

                        <p
                            id="delete-report-description"
                            className="mt-2 text-sm text-slate-700"
                        >
                            You are about to permanently delete{" "}
                            <strong>{itemPendingDeletion.title}</strong>.
                            This action cannot be undone.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={confirmItemDeletion}
                                disabled={deletingItemId === itemPendingDeletion.id}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                            >
                                {deletingItemId === itemPendingDeletion.id
                                    ? "Deleting..."
                                    : "Yes, Delete Report"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setItemPendingDeletion(null)}
                                disabled={Boolean(deletingItemId)}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                            >
                                Cancel
                            </button>
                        </div>
                    </section>
                </div>
            )}

                        <section
                            id="saved-items"
                            className={`mt-8 scroll-mt-24 ${
                                activeTab === "saved"
                                    ? "block"
                                    : "hidden"
                            }`}
                        >
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A6192E]">
                            Your bookmarks
                        </p>

                        <h2 className="mt-1 text-2xl font-bold text-[#1C1B19]">
                            Saved Items
                        </h2>

                        <p className="mt-2 text-sm text-[#6B6560]">
                            Revisit open reports that may be relevant to something you lost or found.
                        </p>
                    </div>

                    <Link
                        to="/browse"
                        className="rounded-xl border border-[#A6192E] bg-white px-4 py-2.5 text-sm font-semibold text-[#A6192E] transition hover:bg-[#A6192E] hover:text-white"
                    >
                        Browse More Items
                    </Link>
                </div>

                {savedItems.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-[#D8D1C8] bg-white px-6 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#A6192E]/10 text-[#A6192E]">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-6 w-6"
                                aria-hidden="true"
                            >
                                <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z" />
                            </svg>
                        </div>

                        <p className="mt-4 font-semibold text-[#1C1B19]">
                            No saved items yet
                        </p>

                        <p className="mx-auto mt-2 max-w-md text-sm text-[#6B6560]">
                            Select the bookmark icon on Browse or Item Details to keep an open report here.
                        </p>

                        <Link
                            to="/browse"
                            className="mt-5 inline-block rounded-xl bg-[#A6192E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
                        >
                            Explore Campus Reports
                        </Link>
                    </div>
                ) : (
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {savedItems.map((savedItem) => (
                            <article
                                key={savedItem.id}
                                role="link"
                                tabIndex={0}
                                onClick={() =>
                                    navigate(`/items/${savedItem.id}`, {
                                        state: {
                                            from: "account",
                                            returnTo: "/account#saved-items",
                                        },
                                    })
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();

                                        navigate(`/items/${savedItem.id}`, {
                                            state: {
                                                from: "account",
                                                returnTo: "/account#saved-items",
                                            },
                                        });
                                    }
                                }}
                                className="group flex h-full cursor-pointer flex-col rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#A6192E]/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A6192E] focus:ring-offset-2"
                            >
                                <div className="relative">
                                    <SavedItemImage item={savedItem} />

                                    <div
                                        className="absolute right-3 top-3"
                                        onClick={(event) => event.stopPropagation()}
                                        onKeyDown={(event) => event.stopPropagation()}
                                    >
                                        <BookmarkButton
                                            item={savedItem}
                                            isSaved
                                            isWorking={
                                                workingSavedItemId ===
                                                savedItem.id
                                            }
                                            onToggle={toggleSavedItem}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                            savedItem.type === "found"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-red-50 text-red-700"
                                        }`}
                                    >
                                        {savedItem.type}
                                    </span>

                                    <span className="rounded-full bg-[#FAF7F2] px-2.5 py-1 text-xs font-semibold capitalize text-[#6B6560]">
                                        {savedItem.status}
                                    </span>
                                </div>

                                <h3 className="mt-3 truncate text-lg font-bold text-[#1C1B19]">
                                    {savedItem.title}
                                </h3>

                                <p className="mt-2 line-clamp-2 text-sm text-[#6B6560]">
                                    {savedItem.description ||
                                        "No description provided."}
                                </p>

                                <div className="mt-4 border-t border-[#E5E0D8] pt-4">
                                    <p className="text-sm text-[#6B6560]">
                                        <span className="font-medium text-[#1C1B19]">
                                            {savedItem.category}
                                        </span>
                                        {" · "}
                                        {savedItem.building}
                                    </p>

                                    <p className="mt-1 truncate text-sm text-[#6B6560]">
                                        {savedItem.location}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section
                className={
                    activeTab === "reports"
                        ? "block"
                        : "hidden"
                }
            >

            <div
                id="my-reports"
                className="mt-8 scroll-mt-24"
            >
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A6192E]">
                            Your listings
                        </p>

                        <h2 className="mt-1 text-2xl font-bold text-[#1C1B19]">
                            My Reports
                        </h2>

                        <p className="mt-2 text-sm text-[#6B6560]">
                            Manage your listings and review possible matches for active reports.
                        </p>
                    </div>

                    <Link
                        to="/post"
                        className="rounded-xl bg-[#A6192E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
                    >
                        New Report
                    </Link>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-[#E5E0D8] bg-white p-2 shadow-sm sm:grid-cols-4">
                    {[
                        {
                            id: "all",
                            label: "All",
                            count: items.length,
                        },
                        {
                            id: "active",
                            label: "Active",
                            count: activeReports.length,
                        },
                        {
                            id: "resolved",
                            label: "Resolved",
                            count: resolvedReports.length,
                        },
                        {
                            id: "moderation",
                            label: "Moderation",
                            count: moderatedReports.length,
                        },
                    ].map((filter) => {
                        const isSelected =
                            reportFilter === filter.id;

                        return (
                            <button
                                key={filter.id}
                                type="button"
                                onClick={() =>
                                    changeReportFilter(filter.id)
                                }
                                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                                    isSelected
                                        ? "bg-[#A6192E] text-white"
                                        : "text-[#6B6560] hover:bg-[#FAF7F2]"
                                }`}
                            >
                                <span>{filter.label}</span>

                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs ${
                                        isSelected
                                            ? "bg-white/20 text-white"
                                            : "bg-[#F1ECE5] text-[#6B6560]"
                                    }`}
                                >
                                    {filter.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {items.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-[#E5E0D8] bg-white px-6 py-10 text-center">
                    <p className="font-semibold text-[#1C1B19]">
                        You haven’t posted any reports
                    </p>

                    <p className="mt-1 text-sm text-[#6B6560]">
                        Create a lost or found report to start receiving possible matches.
                    </p>

                    <Link
                        to="/post"
                        className="mt-4 inline-block text-sm font-semibold text-[#A6192E] hover:underline"
                    >
                        Post an item →
                    </Link>
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-[#E5E0D8] bg-white px-6 py-10 text-center">
                    <p className="font-semibold text-[#1C1B19]">
                        No reports in this category
                    </p>

                    <p className="mt-1 text-sm text-[#6B6560]">
                        Try selecting a different report filter.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            changeReportFilter("all")
                        }
                        className="mt-4 text-sm font-semibold text-[#A6192E] hover:underline"
                    >
                        Show all reports
                    </button>
                </div>
            ) : (
                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    {filteredReports.map((item) => (
                        <article
                            key={item.id}
                            id={`report-${item.id}`}
                            className="scroll-mt-24 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#A6192E]/30 hover:shadow-md"
                        >
                            <ReportImage item={item} />

                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap gap-2">
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                                item.type === "found"
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-red-50 text-red-700"
                                            }`}
                                        >
                                            {item.type}
                                        </span>

                                        <span className="rounded-full bg-[#FAF7F2] px-2.5 py-1 text-xs font-semibold capitalize text-[#6B6560]">
                                            {item.status}
                                        </span>
                                    </div>

                                    <h3 className="mt-3 truncate text-lg font-bold text-[#1C1B19]">
                                        {item.title}
                                    </h3>
                                </div>

                                {canViewPossibleMatches(item) && (
                                    unreadMatchItemIds.includes(item.id) ? (
                                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                        New strong match
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-[#A6192E]/10 px-3 py-1 text-xs font-semibold text-[#A6192E]">
                                        Matching active
                                        </span>
                                    )
                                    )}
                            </div>

                            {item.moderationStatus === "pending_review" && (
                                <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                                    <p className="text-sm font-semibold text-amber-900">
                                        This report is under review
                                    </p>

                                    <p className="mt-1 text-sm text-amber-800">
                                        It is temporarily hidden from Browse while an administrator reviews it.
                                    </p>
                                </div>
                            )}

                            {item.moderationStatus === "hidden" && (
                                <div className="mt-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3">
                                    <p className="text-sm font-semibold text-red-900">
                                        This report was removed
                                    </p>

                                    <p className="mt-1 text-sm text-red-800">
                                        An administrator removed this report because it violated the site's posting guidelines.
                                    </p>
                                </div>
                            )}

                            {item.moderationStatus === "visible" &&
                                item.ownerViewedModeration === false && (
                                    <div className="mt-3 rounded-xl border border-blue-300 bg-blue-50 px-4 py-3">
                                        <p className="text-sm font-semibold text-blue-900">
                                            This report was restored
                                        </p>

                                        <p className="mt-1 text-sm text-blue-800">
                                            An administrator restored this report. If it is still open, it is publicly visible in Browse again.
                                        </p>
                                    </div>
                                )}

                            <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#6B6560]">
                                {item.description || "No description provided."}
                            </p>

                            <div className="mt-4 border-t border-[#E5E0D8] pt-4">
                                <p className="text-sm text-[#6B6560]">
                                    <span className="font-medium text-[#1C1B19]">
                                        {item.category}
                                    </span>
                                    {" · "}
                                    {item.building}
                                </p>

                                <p className="mt-1 text-sm text-[#6B6560]">
                                    {item.location}
                                </p>

                                <p className="mt-2 text-xs text-[#8A837C]">
                                    Date lost or found:{" "}
                                    {item.dateReported ||
                                        "Date unavailable"}
                                </p>
                            </div>
                            <div className="mt-5 flex flex-wrap gap-2 border-t border-[#E5E0D8] pt-4">
                                <Link
                                    to={`/items/${item.id}`}
                                    state={{
                                    from: "account",
                                    returnTo:
                                        `/account${
                                            reportFilter === "all"
                                                ? ""
                                                : `?reportFilter=${reportFilter}`
                                        }#report-${item.id}`,
                                    scrollToMatches:
                                        canViewPossibleMatches(item),
                                    }}
                                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                        canViewPossibleMatches(item)
                                        ? "border border-[#A6192E] bg-[#A6192E] text-white hover:bg-red-800"
                                        : "border border-[#A6192E]/35 bg-white text-[#A6192E] hover:bg-[#A6192E]/5"
                                    }`}
                                    >
                                    {canViewPossibleMatches(item)
                                        ? "View Possible Matches"
                                        : "View Report"}
                                </Link>

                                {item.status === "open" &&
                                    item.moderationStatus !== "pending_review" &&
                                    item.moderationStatus !== "hidden" && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            requestItemResolution(item)
                                        }
                                        disabled={resolvingItemId === item.id}
                                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {resolvingItemId === item.id
                                            ? "Resolving..."
                                            : "Mark as Resolved"}
                                    </button>
                                )}

                                {item.status !== "resolved" &&
                                    item.moderationStatus !== "pending_review" &&
                                    item.moderationStatus !== "hidden" && (
                                    <Link
                                        to={`/items/${item.id}/edit`}
                                        state={{
                                            from: "account",
                                            returnTo: `/account${
                                                reportFilter === "all"
                                                    ? ""
                                                    : `?reportFilter=${reportFilter}`
                                            }#report-${item.id}`,
                                        }}
                                        className="rounded-xl border border-[#D8D1C8] bg-white px-4 py-2 text-sm font-semibold text-[#1C1B19] transition hover:border-[#A6192E]/40 hover:bg-[#FAF7F2]"
                                    >
                                        Edit Report
                                    </Link>
                                )}

                                <button
                                    type="button"
                                    onClick={() => requestItemDeletion(item)}
                                    disabled={deletingItemId === item.id}
                                    className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {deletingItemId === item.id
                                        ? "Deleting..."
                                        : "Delete Report"}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
            </section>
        </main>
    );
}

export default Account;