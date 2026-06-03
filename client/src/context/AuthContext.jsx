import { createContext, useEffect, useMemo, useState } from "react";
import {
  auth,
  googleProvider,
  signInWithPopup,
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

  const syncWithBackend = async (firebaseUser) => {
    await firebaseUser.reload();
    const fresh = auth.currentUser;

    if (!fresh.displayName) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await fresh.reload();
    }

    const current = auth.currentUser;
    const idToken = await current.getIdToken();

    // Prefer displayName, then Google provider profile, then email prefix
    const displayName =
      current.displayName ||
      current.providerData?.[0]?.displayName ||
      current.email?.split("@")[0] ||
      "User";

    const res = await api.post(
      "/auth/firebase-sync",
      {
        uid:      current.uid,
        name:     displayName,
        email:    current.email,
        photoURL: current.photoURL || "",
      },
      { headers: { Authorization: `Bearer ${idToken}` } }
    );
    return { ...res.data.data, idToken };
  };

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

  const getToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  const register = async ({ name, email, password }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await credential.user.reload();
    return credential.user;
  };

  const login = async ({ email, password }) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

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
