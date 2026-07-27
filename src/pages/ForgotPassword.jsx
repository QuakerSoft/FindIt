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
        } catch (error) {
            setMessage("Unable to request a password reset. Please try again.");
            setMessageType("error");
        } finally {
            setIsSending(false);
        }
    }

    return (
        <main className="flex min-h-[80vh] items-center justify-center px-4">
            <section className="w-full max-w-sm rounded-lg border border-[#E5E0D8] bg-white p-8 shadow-sm">
                <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-[#A6192E]">
                    Account recovery
                </p>

                <h1 className="mb-3 text-center font-[Archivo_Black] text-2xl text-[#1C1B19]">
                    Reset your password
                </h1>

                <p className="mb-6 text-center text-sm text-[#6B6560]">
                    Enter the CSUN email connected to your FindIt account.
                </p>

                <form onSubmit={handleReset}>
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
                            className="mt-2 w-full rounded-sm border border-[#D8D2C6] px-4 py-2.5 text-[#1C1B19] placeholder-[#6B6560] transition-colors focus:border-[#A6192E] focus:outline-none focus:ring-1 focus:ring-[#A6192E]"
                        />
                    </label>

                    {message && (
                        <div
                            role="alert"
                            className={`mt-4 rounded-sm border px-4 py-3 text-sm ${
                                messageType === "success"
                                    ? "border-green-200 bg-green-50 text-green-800"
                                    : "border-red-200 bg-red-50 text-red-800"
                            }`}
                        >
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSending}
                        className="mt-6 w-full rounded-sm bg-[#A6192E] py-2.5 font-medium text-white transition-colors hover:bg-[#8a1526] disabled:opacity-60"
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