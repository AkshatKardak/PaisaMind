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

  /* ── On mount: pick up any pending Google redirect result ── */
  useEffect(() => {
    getRedirectResult(auth).catch(() => {
      // silently ignore – onAuthStateChanged handles the user state
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

  /* ── Google Sign-In (redirect – no popup, no COOP issues) ── */
  const loginWithGoogle = async () => {
    await signInWithRedirect(auth, googleProvider);
    // Page will redirect to Google and come back;
    // onAuthStateChanged + getRedirectResult handle the result on return.
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
