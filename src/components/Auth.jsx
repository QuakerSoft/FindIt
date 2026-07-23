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

        <br /><br />

        <button onClick={signUp}>Sign Up</button>{" "}

        <button onClick={logIn}>Log In</button>
        </div>
    );
}

export default Auth;