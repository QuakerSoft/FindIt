import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/config";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, validatePassword, } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function Auth() {
    const inputClass = "w-full rounded-xl border border-[#D8D1C8] bg-white px-4 py-2.5 text-sm text-[#1C1B19] outline-none transition placeholder:text-[#8A837C] focus:border-[#A6192E] focus:ring-4 focus:ring-[#A6192E]/10";
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSignUpMode, setIsSignUpMode] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const passwordChecks = {
        minimumLength: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        specialCharacter: /[^A-Za-z0-9]/.test(password),
    };

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

            function switchAuthMode(signUpMode) {
                setIsSignUpMode(signUpMode);
                setConfirmPassword("");
                setMessage("");
                setMessageType("");
            }

    const signUp = async () => {
    try {
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
                "Please sign up using a valid CSUN email ending in @my.csun.edu or @csun.edu."
            );
            setMessageType("error");
            return;
        }

        if (!password) {
            setMessage("Please create a password.");
            setMessageType("error");
            return;
        }

        if (!confirmPassword) {
            setMessage("Please confirm your password.");
            setMessageType("error");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("The passwords do not match.");
            setMessageType("error");
            return;
        }

        const passwordStatus = await validatePassword(auth, password);

        if (!passwordStatus.isValid) {
            setMessage(
                "Your password does not meet all of the requirements below."
            );
            setMessageType("error");
            return;
        }

        const accountRole = getAccountRole(normalizedEmail);

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                normalizedEmail,
                password
            );

        await setDoc(
            doc(db, "users", userCredential.user.uid),
            {
                email: normalizedEmail,
                role: accountRole,
                firstName: "",
                lastName: "",
                phoneNumber: "",
                contactPreference: "email",
                profileComplete: false,
            }
        );

        navigate("/complete-profile");
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

        async function handleSubmit(event) {
        event.preventDefault();

        if (isSignUpMode) {
            await signUp();
        } else {
            await logIn();
        }
    }

    return (
        <main className="flex min-h-[80vh] items-center justify-center px-4 py-10">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-3xl border border-[#E5E0D8] bg-white p-6 shadow-md sm:p-8"
            >
                <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-[#A6192E]">
                    {isSignUpMode
                        ? "Join the CSUN community"
                        : "Welcome back"}
                </p>

                <h1 className="mt-2 text-center text-3xl font-bold text-[#1C1B19]">
                    {isSignUpMode
                        ? "Create your FindIt account"
                        : "Log in to FindIt"}
                </h1>

                <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-[#6B6560]">
                    Use your CSUN email ending in @my.csun.edu or @csun.edu.
                </p>
                <div className="mt-6 flex flex-col gap-4">
                    
                    <input
                        type="email"
                        placeholder="Enter your CSUN email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className={inputClass}
                    />

                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder={isSignUpMode ? "Create a password" : "Password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete={isSignUpMode ? "new-password" : "current-password"}
                        className={inputClass}
                    />

                    {isSignUpMode && (
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                            autoComplete="new-password"
                            className={inputClass}
                        />
                    )}

                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#6B6560]">
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={(event) =>
                                setShowPassword(event.target.checked)
                            }
                            className="h-4 w-4 accent-[#A6192E]"
                        />

                        Show password{isSignUpMode ? "s" : ""}
                </label>

                {isSignUpMode && (
                    <div className="rounded-2xl border border-[#E5E0D8] bg-[#FAF7F2] px-4 py-4">
                        <p className="mb-2 text-sm font-medium text-[#1C1B19]">
                            Password requirements
                        </p>

                        <ul className="space-y-1 text-xs">
                            <li
                                className={
                                    passwordChecks.minimumLength
                                        ? "text-emerald-700"
                                        : "text-[#6B6560]"
                                }
                            >
                                {passwordChecks.minimumLength ? "✓" : "○"} At least 8
                                characters
                            </li>

                            <li
                                className={
                                    passwordChecks.lowercase
                                        ? "text-emerald-700"
                                        : "text-[#6B6560]"
                                }
                            >
                                {passwordChecks.lowercase ? "✓" : "○"} One lowercase
                                letter
                            </li>

                            <li
                                className={
                                    passwordChecks.uppercase
                                        ? "text-emerald-700"
                                        : "text-[#6B6560]"
                                }
                            >
                                {passwordChecks.uppercase ? "✓" : "○"} One uppercase
                                letter
                            </li>

                            <li
                                className={
                                    passwordChecks.number
                                        ? "text-emerald-700"
                                        : "text-[#6B6560]"
                                }
                            >
                                {passwordChecks.number ? "✓" : "○"} One number
                            </li>

                            <li
                                className={
                                    passwordChecks.specialCharacter
                                        ? "text-emerald-700"
                                        : "text-[#6B6560]"
                                }
                            >
                                {passwordChecks.specialCharacter ? "✓" : "○"} One
                                special character, such as !, @, #, or $
                            </li>
                            </ul>

                            <p className="mt-2 text-xs text-[#6B6560]">
                                Example format: Matador!2026
                            </p>
                        </div>
                    )}
                </div>

                {message && (
                    <div
                        role="alert"
                        className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
                            messageType === "success"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-red-200 bg-red-50 text-red-800"
                            }`}
                        >
                            {message}
                        </div>
                    )}

                {isSignUpMode ? (
                    <div className="mt-6">
                        <button
                            type="submit"
                            className="w-full rounded-xl bg-[#A6192E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800"
                        >
                            Create Account
                        </button>

                        <button
                            type="button"
                            onClick={() => switchAuthMode(false)}
                            className="mt-4 w-full text-sm font-medium text-[#A6192E] hover:underline"
                        >
                            Already have an account? Log in
                        </button>
                    </div>
                ) : (
                    <div className="mt-6">
                        <button
                            type="submit"
                            className="w-full rounded-xl bg-[#A6192E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800"
                        >
                            Log In
                        </button>

                        <button
                            type="button"
                            onClick={() => switchAuthMode(true)}
                            className="mt-4 w-full text-sm font-medium text-[#A6192E] hover:underline"
                        >
                            Need an account? Sign up
                        </button>
                    </div>
                )}

                {!isSignUpMode && (
                    <Link
                        to="/forgot-password"
                        className="mt-4 block w-full text-center text-sm font-medium text-[#A6192E] hover:underline"
                    >
                        Forgot your password?
                    </Link>
                )}
            </form>
        </main>
    );
}

export default Auth;