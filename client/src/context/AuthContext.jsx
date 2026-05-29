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
    // Reload the Firebase profile so displayName is always fresh
    await firebaseUser.reload();
    const fresh = auth.currentUser;

    // If displayName is still missing (race condition after register),
    // wait briefly and reload once more before falling back to email prefix
    if (!fresh.displayName) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await fresh.reload();
    }

    const current = auth.currentUser;
    const idToken = await current.getIdToken();
    const res = await api.post(
      "/auth/firebase-sync",
      {
        uid:      current.uid,
        name:     current.displayName || current.email?.split("@")[0] || "User",
        email:    current.email,
        photoURL: current.photoURL || "",
      },
      { headers: { Authorization: `Bearer ${idToken}` } }
    );
    return { ...res.data.data, idToken };
  };

  /* ── On mount: pick up any pending Google redirect result ── */
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
    // updateProfile must complete before the auth state observer fires
    await updateProfile(credential.user, { displayName: name });
    // Force-reload so the displayName is immediately visible
    await credential.user.reload();
    return credential.user;
  };

  /* ── Email / Password Login ── */
  const login = async ({ email, password }) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  };

  /* ── Google Sign-In via redirect (avoids COOP/popup issues entirely) ── */
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
