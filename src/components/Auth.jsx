import { useState } from "react";
import { auth, db } from "../firebase/config";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function Auth() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const signUp = async () => {
        try {
            const userCredential =
                await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(
                    doc(db, "users", userCredential.user.uid),
                    {
                        email: email,
                        role: "student",
                    }
                );
            alert("Account created successfully!");
        } catch (error) {
            alert(error.message);
        }
    };

    const logIn = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Logged in!");
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div>
            <h2 class="pb-5">FindIt Login</h2>

            <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            />

        <br /><br />

        <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        />
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-sm bg-white border border-[#E5E0D8] rounded-lg shadow-sm p-8">
                <p className="text-[#A6192E] text-xs font-semibold tracking-widest uppercase mb-2 text-center">Welcome Back!</p>
                <h2 className="font-[Archivo_Black] text-2xl text-[#1C1B19] text-center mb-8">FindIt Login</h2>

                <div className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={logIn}
                        className="flex-1 bg-[#A6192E] text-white font-medium py-2.5 rounded-sm hover:bg-[#8a1526] transition-colors"
                    >
                        Log In
                    </button>
                    <button
                        onClick={signUp}
                        className="flex-1 border-2 border-[#1C1B19] text-[#1C1B19] font-medium py-2.5 rounded-sm hover:bg-[#1C1B19] hover:text-white transition-colors"
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Auth;