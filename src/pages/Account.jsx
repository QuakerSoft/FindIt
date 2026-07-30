import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase/config";
import {
    deleteItem,
    getClaimsByClaimant,
    getClaimsByOwner,
    getUserProfile,
    getItemsByOwner,
    updateClaimStatus,
    updateUserProfile,
    markItemResolved,
    markReceivedClaimsViewed,
    markSubmittedClaimResponsesViewed,
} from "../firebase/firestore";

function ReportImage({ item }) {
    const [imageStatus, setImageStatus] = useState("loading");

    if (!item.imageUrl) {
        return null;
    }

    if (imageStatus === "error") {
        return (
            <div className="mb-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-600">
                    This report’s image could not be loaded.
                </p>
            </div>
        );
    }

    return (
        <div className="mb-4">
            {imageStatus === "loading" && (
                <p className="mb-2 text-sm text-slate-500">
                    Loading image...
                </p>
            )}

            <img
                src={item.imageUrl}
                alt={item.title}
                referrerPolicy="no-referrer"
                className={`max-h-64 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain p-2 ${
                    imageStatus === "loading" ? "opacity-0" : "opacity-100"
                }`}
                onLoad={() => setImageStatus("loaded")}
                onError={() => setImageStatus("error")}
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

function Account() {
    const [profile, setProfile] = useState(null);
    const [items, setItems] = useState([]);
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
                ] = await Promise.all([
                    getUserProfile(currentUser.uid),
                    getItemsByOwner(currentUser.uid),
                    getClaimsByOwner(currentUser.uid),
                    getClaimsByClaimant(currentUser.uid),
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
            if (
                isLoading ||
                window.location.hash !== "#received-requests"
            ) {
                return;
            }

            const animationFrameId = window.requestAnimationFrame(
                () => {
                    document
                        .getElementById("received-requests")
                        ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        });
                }
            );

            return () =>
                window.cancelAnimationFrame(animationFrameId);
        }, [isLoading]);

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
        };

        return statusLabels[status] || "Unknown";
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
                itemPendingResolution.id
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

    return (
        <main className="pt-3 mx-auto max-w-5xl py-12">
            <h1 className="text-3xl font-bold">
                My Account
            </h1>

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
                <section className="mt-6 max-w-xl">
                    <p className="mb-6 text-lg text-slate-700">
                        Welcome back,{" "}
                        <span className="font-semibold text-slate-900">
                            {profile.firstName}
                        </span>
                        !
                    </p>

                    <div className="pl-7 py-6 mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Profile Information
                        </h2>

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

            <section
                id="received-requests"
                className="mt-10 scroll-mt-24"
            >
                <h2 className="text-2xl font-semibold text-slate-900">
                    Requests Received
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                    Review responses submitted for your lost and found reports.
                </p>

                {receivedClaims.length === 0 ? (
                    <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        You haven't received any requests yet.
                    </p>
                ) : (
                    <div className="mt-5 space-y-4">
                        {receivedClaims.map((claim) => (
                            <article
                                key={claim.id}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                                            {getRequestLabel(claim)}
                                        </p>

                                        <h3 className="mt-1 text-lg font-semibold text-slate-900">
                                            {claim.itemTitle}
                                        </h3>
                                        <p className="mt-2 text-sm text-slate-600">
                                            Request from{" "}
                                            <span className="font-semibold text-slate-900">
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
                                                claim.status === "accepted"
                                                    ? "bg-green-100 text-green-800"
                                                    : claim.status === "rejected"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-amber-100 text-amber-800"
                                            }`}
                                        >
                                            {formatClaimStatus(claim.status)}
                                        </span>
                                    </div>
                                </div>

                                <p className="mt-4 text-sm text-slate-700">
                                    {claim.message}
                                </p>

                                <p className="mt-3 text-xs text-slate-500">
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
                                            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {respondingClaimId === claim.id
                                                ? "Saving..."
                                                : "Review Acceptance"}
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
                                            className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {respondingClaimId === claim.id
                                                ? "Saving..."
                                                : "Review Rejection"}
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
                                    state={{ from: "account" }}
                                    className="mt-4 inline-block text-sm font-semibold text-red-600 hover:text-red-700"
                                >
                                    View Report →
                                </Link>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="mt-10">
                <h2 className="text-2xl font-semibold text-slate-900">
                    Requests You Submitted
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                    Track the status of requests you've sent to other users.
                </p>

                {submittedClaims.length === 0 ? (
                    <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        You haven't submitted any requests yet.
                    </p>
                ) : (
                    <div className="mt-5 space-y-4">
                        {submittedClaims.map((claim) => (
                            <article
                                key={claim.id}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                                            {getRequestLabel(claim)}
                                        </p>

                                        <h3 className="mt-1 text-lg font-semibold text-slate-900">
                                            {claim.itemTitle}
                                        </h3>
                                        <p className="mt-2 text-sm font-medium text-slate-600">
                                            Request submitted by you
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
                                                claim.status === "accepted"
                                                    ? "bg-green-100 text-green-800"
                                                    : claim.status === "rejected"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-amber-100 text-amber-800"
                                            }`}
                                        >
                                            {formatClaimStatus(claim.status)}
                                        </span>
                                    </div>
                                </div>

                                <p className="mt-4 text-sm text-slate-700">
                                    {claim.message}
                                </p>

                                <p className="mt-3 text-xs text-slate-500">
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
                                    state={{ from: "account" }}
                                    className="mt-4 inline-block text-sm font-semibold text-red-600 hover:text-red-700"
                                >
                                    View Report →
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

            <h2 className="mt-7 text-2xl font-semibold">
                My Reports
            </h2>

            {items.length === 0 ? (
                <p className="mt-3 text-slate-600">
                    You haven't posted any lost or found items yet.
                </p>
            ) : (
                <div className="mt-5 space-y-4">
                    {items.map((item) => (
                        <article
                            key={item.id}
                            className="rounded-xl border border-slate-200 p-4"
                        >
                            <ReportImage item={item} />

                            <h3 className="text-lg font-semibold">
                                {item.title}
                            </h3>

                            <p className="mt-1 text-sm text-slate-600">
                                {item.description}
                            </p>

                            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                                <p>
                                    <strong>Type:</strong> {item.type}
                                </p>

                                <p>
                                    <strong>Status:</strong> {item.status}
                                </p>

                                <p>
                                    <strong>Category:</strong> {item.category}
                                </p>

                                <p>
                                    <strong>Building:</strong> {item.building}
                                </p>

                                <p>
                                    <strong>Location:</strong> {item.location}
                                </p>

                                <p>
                                    <strong>Date:</strong> {item.dateReported}
                                </p>
                            </div>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <Link
                                    to={`/items/${item.id}`}
                                    state={{ from: "account" }}
                                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    View Report
                                </Link>

                                {item.status === "open" && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            requestItemResolution(item)
                                        }
                                        disabled={resolvingItemId === item.id}
                                        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                                    >
                                        {resolvingItemId === item.id
                                            ? "Resolving..."
                                            : "Mark as Resolved"}
                                    </button>
                                )}

                                <Link
                                    to={`/items/${item.id}/edit`}
                                    className="rounded-xl border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                                >
                                    Edit Report
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => requestItemDeletion(item)}
                                    disabled={deletingItemId === item.id}
                                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
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
        </main>
    );
}

export default Account;