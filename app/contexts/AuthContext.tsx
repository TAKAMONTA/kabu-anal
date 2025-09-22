"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  User as FirebaseUser,
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
import type { User, UserPreferences } from "../types";

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

interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: any;
  lastLoginAt: any;
  subscription: "free" | "premium";
  agreedToTerms: boolean;
  agreedToTermsAt?: any;
  preferences?: UserPreferences;
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

  // ユーザー情報をFirestoreに保存
  const saveUserToFirestore = useCallback(
    async (user: FirebaseUser, isNewUser: boolean = false): Promise<void> => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        const defaultPreferences: UserPreferences = {
          theme: "light",
          language: "ja",
          notifications: true,
          emailNotifications: true,
          pushNotifications: false,
        };

        if (!userDoc.exists()) {
          const userProfileData: UserProfileData = {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "",
            photoURL: user.photoURL || undefined,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            subscription: "free",
            agreedToTerms: isNewUser,
            agreedToTermsAt: isNewUser ? serverTimestamp() : null,
            preferences: defaultPreferences,
          };

          await setDoc(userDocRef, userProfileData);
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
        throw err;
      }
    },
    []
  );

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const isNewUser = (result as any)._tokenResponse?.isNewUser || false;
      await saveUserToFirestore(result.user, isNewUser);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Googleサインインに失敗しました";
      setError(errorMessage);
      throw err;
    }
  };

  // メール/パスワードでのログイン
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);

      // 入力値の検証
      if (!email || !password) {
        setError("メールアドレスとパスワードを入力してください");
        return;
      }

      if (!email.includes("@")) {
        setError("有効なメールアドレスを入力してください");
        return;
      }

      if (password.length < 6) {
        setError("パスワードは6文字以上で入力してください");
        return;
      }

      const result = await signInWithEmailAndPassword(auth, email, password);
      await saveUserToFirestore(result.user);
    } catch (err: unknown) {
      console.error("Login error:", err);

      if (err && typeof err === "object" && "code" in err) {
        const firebaseError = err as { code: string; message?: string };

        switch (firebaseError.code) {
          case "auth/invalid-credential":
            setError(
              "メールアドレスまたはパスワードが正しくありません。確認して再度お試しください。"
            );
            break;
          case "auth/user-not-found":
            setError(
              "このメールアドレスは登録されていません。新規登録してください。"
            );
            break;
          case "auth/wrong-password":
            setError("パスワードが間違っています。");
            break;
          case "auth/invalid-email":
            setError("有効なメールアドレスを入力してください。");
            break;
          case "auth/user-disabled":
            setError(
              "このアカウントは無効化されています。管理者にお問い合わせください。"
            );
            break;
          case "auth/too-many-requests":
            setError(
              "ログイン試行回数が多すぎます。しばらく時間をおいてから再度お試しください。"
            );
            break;
          case "auth/network-request-failed":
            setError(
              "ネットワークエラーが発生しました。インターネット接続を確認してください。"
            );
            break;
          default:
            setError(
              firebaseError.message || "ログインでエラーが発生しました。"
            );
        }
      } else {
        setError(
          "予期しないエラーが発生しました。しばらく時間をおいてから再度お試しください。"
        );
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
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err) {
        const firebaseError = err as { code: string; message?: string };
        if (firebaseError.code === "auth/email-already-in-use") {
          setError("このメールアドレスは既に使用されています");
        } else if (firebaseError.code === "auth/weak-password") {
          setError("パスワードは6文字以上で設定してください");
        } else {
          setError(firebaseError.message || "登録でエラーが発生しました");
        }
      } else {
        setError("登録でエラーが発生しました");
      }
      throw err;
    }
  };

  // ログアウト
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "ログアウトでエラーが発生しました";
      setError(errorMessage);
      throw err;
    }
  };

  // パスワードリセット
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err) {
        const firebaseError = err as { code: string; message?: string };
        if (firebaseError.code === "auth/user-not-found") {
          setError("このメールアドレスは登録されていません");
        } else {
          setError(
            firebaseError.message ||
              "パスワードリセットメールの送信でエラーが発生しました"
          );
        }
      } else {
        setError("パスワードリセットメールの送信でエラーが発生しました");
      }
      throw err;
    }
  };

  // エラークリア
  const clearError = () => {
    setError(null);
  };

  // Firebase UserをカスタムUser型に変換
  const convertFirebaseUserToUser = useCallback(
    (firebaseUser: FirebaseUser | null): User | null => {
      if (!firebaseUser) return null;

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || undefined,
        plan: "free", // デフォルト値
        createdAt: new Date(), // デフォルト値
        lastLoginAt: new Date(), // デフォルト値
        preferences: {
          theme: "light",
          language: "ja",
          notifications: true,
          emailNotifications: true,
          pushNotifications: false,
        },
      };
    },
    []
  );

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      const customUser = convertFirebaseUserToUser(firebaseUser);
      setUser(customUser);
      setLoading(false);
    });

    return unsubscribe;
  }, [convertFirebaseUserToUser]);

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
