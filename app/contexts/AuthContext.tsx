"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 繝ｦ繝ｼ繧ｶ繝ｼ諠・ｱ繧巽irestore縺ｫ菫晏ｭ・
  const saveUserToFirestore = async (
    user: User,
    isNewUser: boolean = false
  ) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          subscription: "free",
          agreedToTerms: isNewUser, // 新規登録時の同意済み
          agreedToTermsAt: isNewUser ? serverTimestamp() : null,
        });
      } else {
        await setDoc(
          userDocRef,
          {
            lastLoginAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.error("Error saving user to Firestore:", err);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const isNewUser = (result as any)._tokenResponse?.isNewUser || false;
      await saveUserToFirestore(result.user, isNewUser);
    } catch (err: any) {
      setError(err.message || "Googleサインインに失敗しました");
      throw err;
    }
  };

  // メール/パスワードでの新規登録
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      await saveUserToFirestore(result.user);
    } catch (err: any) {
      if (err.code === "auth/invalid-credential") {
        setError("メールアドレスまたはパスワードが正しくありません");
      } else if (err.code === "auth/user-not-found") {
        setError("このメールアドレスは登録されていません");
      } else {
        setError(err.message || "ログインでエラーが発生しました");
      }
      throw err;
    }
  };

  // メール/パスワードでの新規登録
  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // プロフィール更新
      if (result.user && displayName) {
        await updateProfile(result.user, { displayName });
      }

      // 新規登録は初回ログインとして記録
      await saveUserToFirestore(result.user, true);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("このメールアドレスは既に使用されています");
      } else if (err.code === "auth/weak-password") {
        setError("パスワードは6文字以上で設定してください");
      } else {
        setError(err.message || "登録でエラーが発生しました");
      }
      throw err;
    }
  };

  // ログアウト
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err: any) {
      setError(err.message || "ログアウトでエラーが発生しました");
      throw err;
    }
  };

  // パスワードリセット
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("このメールアドレスは登録されていません");
      } else {
        setError(
          err.message || "パスワードリセットメールの送信でエラーが発生しました"
        );
      }
      throw err;
    }
  };

  // エラークリア
  const clearError = () => {
    setError(null);
  };

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    resetPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
