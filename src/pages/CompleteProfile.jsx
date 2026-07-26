import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

function CompleteProfile() {
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [contactPreference, setContactPreference] = useState("email");
    const [message, setMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    function isValidPhoneNumber(phoneValue) {
        const digitsOnly = phoneValue.replace(/\D/g, "");
        return digitsOnly.length === 10;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const currentUser = auth.currentUser;

        if (!currentUser) {
            navigate("/login");
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

            await setDoc(
                doc(db, "users", currentUser.uid),
                {
                    firstName: trimmedFirstName,
                    lastName: trimmedLastName,
                    phoneNumber: normalizedPhone,
                    contactPreference,
                    profileComplete: true,
                },
                { merge: true }
            );

            navigate("/browse");
        } catch (error) {
            console.error("Profile save error:", error);
            setMessage("Unable to save your profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <main className="mx-auto max-w-xl py-10">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
                    Profile setup
                </p>

                <h1 className="mt-2 text-3xl font-bold text-slate-900">
                    Complete your profile
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                    Add your name and choose how other CSUN users may contact you about
                    lost or found items. A phone number is only required when Phone is
                    included in your contact preference.
                </p>

                <form onSubmit={handleSubmit} className="mt-6">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-slate-700">
                            First name
                            <input
                                type="text"
                                value={firstName}
                                onChange={(event) =>
                                    setFirstName(event.target.value)
                                }
                                placeholder="Enter your first name"
                                autoComplete="given-name"
                                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-50"
                                required
                            />
                        </label>

                        <label className="block text-sm font-medium text-slate-700">
                            Last name
                            <input
                                type="text"
                                value={lastName}
                                onChange={(event) =>
                                    setLastName(event.target.value)
                                }
                                placeholder="Enter your last name"
                                autoComplete="family-name"
                                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-50"
                                required
                            />
                        </label>
                    </div>

                    <label className="mt-5 block text-sm font-medium text-slate-700">
                        Phone number {contactPreference === "email" ? "(optional)" : "(required)"}
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(event) =>
                                setPhoneNumber(event.target.value)
                            }
                            placeholder="Enter an optional phone number"
                            autoComplete="tel"
                            inputMode="tel"
                            maxLength="14"
                            required={
                                contactPreference === "phone" ||
                                contactPreference === "both"
                            }
                            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-50"
                        />
                    </label>

                    <span className="mt-2 block text-xs font-normal text-slate-500">
                        Enter a 10-digit U.S. phone number. Example: (818) 555-1234.
                    </span>

                    <label className="mt-5 block text-sm font-medium text-slate-700">
                        How should people contact you?
                        <select
                            value={contactPreference}
                            onChange={(event) =>
                                setContactPreference(event.target.value)
                            }
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-50"
                        >
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="both">Email & Phone</option>
                        </select>

                        <span className="mt-2 block text-xs font-normal text-slate-500">
                            This is how other CSUN users may contact you about lost or found
                            items. Account verification and password recovery will still use
                            your CSUN email.
                        </span>
                    </label>

                    <label className="mt-5 block text-sm font-medium text-slate-700">
                        CSUN email
                        <input
                            type="email"
                            value={auth.currentUser?.email || ""}
                            disabled
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500"
                        />
                    </label>

                    {message && (
                        <div
                            role="alert"
                            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                        >
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="mt-7 w-full rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                        {isSaving ? "Saving profile..." : "Complete profile"}
                    </button>
                </form>
            </section>
        </main>
    );
}

export default CompleteProfile;