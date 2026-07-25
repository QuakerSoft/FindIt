import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/config";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function Auth() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    function isCampusEmail(emailAddress) {
        const normalizedEmail = emailAddress.trim().toLowerCase();

        return (
            normalizedEmail.endsWith("@my.csun.edu") ||
            normalizedEmail.endsWith("@csun.edu")
        );
    }

    function getAccountRole(emailAddress) {
        return emailAddress.endsWith("@my.csun.edu")
            ? "student"
            : "faculty-staff";
        }

        function getAuthErrorMessage(errorCode) {
            switch (errorCode) {
                case "auth/invalid-credential":
                case "auth/wrong-password":
                case "auth/user-not-found":
                    return "The email or password is incorrect.";

                case "auth/email-already-in-use":
                    return "An account already exists with this email.";

                case "auth/weak-password":
                    return "Your password must be at least 6 characters long.";

                case "auth/invalid-email":
                    return "Please enter a valid email address.";

                case "auth/too-many-requests":
                    return "Too many attempts. Please wait a moment and try again.";

                default:
                    return "Something went wrong. Please try again.";
                }
            }

    const signUp = async () => {
        try {
            setMessage("");
            setMessageType("");

            const normalizedEmail = email.trim().toLowerCase();
            const accountRole = getAccountRole(normalizedEmail);

            if (!isCampusEmail(normalizedEmail)) {
                setMessage("Please sign up using a valid CSUN email ending in @my.csun.edu or @csun.edu.");
                return;
            }

            const userCredential =
                await createUserWithEmailAndPassword(auth, normalizedEmail, password);
                await setDoc(
                    doc(db, "users", userCredential.user.uid),
                {
                    email: normalizedEmail,
                    role: accountRole,
                }
                );
            navigate("/browse");
        } catch (error) {
            setMessage(getAuthErrorMessage(error.code));
            setMessageType("error");
        }
    };

    const logIn = async () => {
        try {
            setMessage("");
            setMessageType("");

            await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
            navigate("/browse");
        } catch (error) {
            setMessage(getAuthErrorMessage(error.code));
            setMessageType("error");
        }
    };

    const resetPassword = async () => {
        setMessage("");
        setMessageType("");

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            setMessage("Enter your email address first.");
            setMessageType("error");
            return;
        }

        if (!isCampusEmail(normalizedEmail)) {
            setMessage(
                "Please sign up using a valid CSUN email ending in @my.csun.edu or @csun.edu."
            );
            setMessageType("error");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, normalizedEmail);
            setMessage(
                "If an account exists for this email, a password reset link has been sent. Please check your inbox and spam folder."
            );
            setMessageType("success");
        } catch (error) {
            setMessage(getAuthErrorMessage(error.code));
            setMessageType("error");
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-sm bg-white border border-[#E5E0D8] rounded-lg shadow-sm p-8">
                <p className="text-[#A6192E] text-xs font-semibold tracking-widest uppercase mb-2 text-center">Welcome Back!</p>
                <h2 className="font-[Archivo_Black] text-2xl text-[#1C1B19] text-center mb-8">FindIt Login</h2>

                <div className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Enter your CSUN email (@my.csun.edu or @csun.edu)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="border border-[#D8D2C6] rounded-sm px-4 py-2.5 text-[#1C1B19] placeholder-[#6B6560] focus:outline-none focus:border-[#A6192E] focus:ring-1 focus:ring-[#A6192E] transition-colors"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border border-[#D8D2C6] rounded-sm px-4 py-2.5 text-[#1C1B19] placeholder-[#6B6560] focus:outline-none focus:border-[#A6192E] focus:ring-1 focus:ring-[#A6192E] transition-colors"
                    />
                </div>

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

                <div className="flex gap-3 mt-6">
                    <button
                        type="button"
                        onClick={logIn}
                        className="flex-1 bg-[#A6192E] text-white font-medium py-2.5 rounded-sm hover:bg-[#8a1526] transition-colors"
                    >
                        Log In
                    </button>
                    <button
                        type="button"
                        onClick={signUp}
                        className="flex-1 border-2 border-[#1C1B19] text-[#1C1B19] font-medium py-2.5 rounded-sm hover:bg-[#1C1B19] hover:text-white transition-colors"
                    >
                        Sign Up
                    </button>
                </div>

                <button
                    type="button"
                    onClick={resetPassword}
                    className="mt-4 w-full text-sm font-medium text-[#A6192E] hover:underline"
                >
                    Forgot your password?
                </button>
            </div>
        </div>
    );
}

export default Auth;