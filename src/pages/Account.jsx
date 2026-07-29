import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase/config";
import {
    deleteItem,
    getUserProfile,
    getItemsByOwner,
    updateUserProfile,
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
                const profileData = await getUserProfile(currentUser.uid);
                const userItems = await getItemsByOwner(currentUser.uid);

                setProfile(profileData);
                setItems(userItems);

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

    function isValidPhoneNumber(phoneValue) {
        const digitsOnly = phoneValue.replace(/\D/g, "");
        return digitsOnly.length === 10;
    }

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
                            disabled={isSaving}
                            className="border border-transparent rounded-xl bg-[#A6192E] px-5 py-2.5 font-semibold text-white disabled:opacity-60 transition hover:bg-white hover:text-[#A6192E] hover:border-[#A6192E]"
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
                                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    View Report
                                </Link>

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