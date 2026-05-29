import { createContext, useEffect, useMemo, useState } from "react";
import {
  auth,
  googleProvider,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "../config/firebase";
import api from "../services/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  /* ── sync Firebase user → our Express backend ── */
  const syncWithBackend = async (firebaseUser) => {
    const idToken = await firebaseUser.getIdToken();
    const res = await api.post(
      "/auth/firebase-sync",
      {
        uid:      firebaseUser.uid,
        name:     firebaseUser.displayName || "PaisaMind User",
        email:    firebaseUser.email,
        photoURL: firebaseUser.photoURL || "",
      },
      { headers: { Authorization: `Bearer ${idToken}` } }
    );
    return { ...res.data.data, idToken };
  };

  /* ── On mount: pick up any pending Google redirect result ──
     getRedirectResult resolves with a UserCredential when the user
     returns from Google's OAuth page, or null if no redirect occurred.
     onAuthStateChanged will also fire, so we just silently handle
     any errors here without duplicating the sync logic. */
  useEffect(() => {
    getRedirectResult(auth).catch(() => {
      // Silently ignore — onAuthStateChanged handles user state on return
    });
  }, []);

  /* ── listen to Firebase auth state ── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await syncWithBackend(firebaseUser);
          setUser(profile);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  /* ── get fresh ID token for every API call ── */
  const getToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  /* ── Email / Password Register ── */
  const register = async ({ name, email, password }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    return credential.user;
  };

  /* ── Email / Password Login ── */
  const login = async ({ email, password }) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  };

  /* ── Google Sign-In via redirect (avoids COOP/popup issues entirely) ──
     The browser navigates to Google's OAuth page and returns here.
     onAuthStateChanged fires on return and syncs the user automatically.
     No navigate() call needed in the Login component. */
  const loginWithGoogle = async () => {
    await signInWithRedirect(auth, googleProvider);
  };

  /* ── Logout ── */
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    register,
    login,
    loginWithGoogle,
    logout,
    getToken,
    setUser,
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
