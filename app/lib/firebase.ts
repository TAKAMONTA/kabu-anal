// Firebase configuration
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Authentication functions
export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { success: true, user: userCredential.user };
  } catch (error: unknown) {
    let errorMessage = "Registration failed";
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered";
      } else if (firebaseError.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters";
      } else if (firebaseError.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      }
    }
    return { success: false, error: errorMessage };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { success: true, user: userCredential.user };
  } catch (error: unknown) {
    let errorMessage = "Login failed";
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === "auth/user-not-found") {
        errorMessage = "User not found";
      } else if (firebaseError.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (firebaseError.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      }
    }
    return { success: false, error: errorMessage };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Logout failed";
    return { success: false, error: errorMessage };
  }
};

// Export types and functions
export type { User };
export { onAuthStateChanged };
