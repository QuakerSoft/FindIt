import { useState } from "react";
import { Link } from "react-router-dom";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [isSending, setIsSending] = useState(false);

    function isCampusEmail(emailAddress) {
        const normalizedEmail = emailAddress.trim().toLowerCase();

        return (
            normalizedEmail.endsWith("@my.csun.edu") ||
            normalizedEmail.endsWith("@csun.edu")
        );
    }

    async function handleReset(event) {
        event.preventDefault();

        setMessage("");
        setMessageType("");

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            setMessage("Please enter your CSUN email.");
            setMessageType("error");
            return;
        }

        if (!isCampusEmail(normalizedEmail)) {
            setMessage(
                "Please enter a valid CSUN email ending in @my.csun.edu or @csun.edu."
            );
            setMessageType("error");
            return;
        }

        try {
            setIsSending(true);

            const response = await fetch("/api/send-reset-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: normalizedEmail }),
            });

            if (!response.ok) {
                throw new Error("Reset request failed");
            }

            setMessage(
                "If an eligible account exists for this email, a password reset link has been requested. Check your inbox or spam."
            );
            setMessageType("success");
        } catch{
            setMessage("Unable to request a password reset. Please try again.");
            setMessageType("error");
        } finally {
            setIsSending(false);
        }
    }

    return (
        <main className="flex min-h-[80vh] items-center justify-center px-4 py-10">
            <section className="w-full max-w-md rounded-3xl border border-[#E5E0D8] bg-white p-6 shadow-md sm:p-8">
                <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-[#A6192E]">
                    Account recovery
                </p>

                <h1 className="mt-2 text-center text-3xl font-bold text-[#1C1B19]">
                    Reset your password
                </h1>

                <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-[#6B6560]">
                    Enter the CSUN email connected to your FindIt account.
                </p>

                <form
                    onSubmit={handleReset}
                    className="mt-6"
                >
                    <label className="block text-sm font-medium text-[#1C1B19]">
                        CSUN email
                        <input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="Enter your CSUN email"
                            autoComplete="email"
                            className="mt-2 w-full rounded-xl border border-[#D8D1C8] bg-white px-4 py-2.5 text-sm text-[#1C1B19] outline-none transition placeholder:text-[#8A837C] focus:border-[#A6192E] focus:ring-4 focus:ring-[#A6192E]/10"
                        />
                    </label>

                    {message && (
                        <div
                            role="alert"
                            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                                messageType === "success"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : "border-red-200 bg-red-50 text-red-800"
                            }`}
                        >
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSending}
                        className="mt-6 w-full rounded-xl bg-[#A6192E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                    >
                        {isSending
                            ? "Requesting reset..."
                            : "Send reset link"}
                    </button>
                </form>

                <Link
                    to="/login"
                    className="mt-5 block text-center text-sm font-medium text-[#A6192E] hover:underline"
                >
                    ← Back to Log In
                </Link>
            </section>
        </main>
    );
}

export default ForgotPassword;