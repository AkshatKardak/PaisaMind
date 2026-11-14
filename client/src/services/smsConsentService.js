/**
 * SMS User Consent Service
 * Implements Phase 3: Android SMS User Consent (SmsRetriever / Web OTP API).
 * Never declares READ_SMS or RECEIVE_SMS.
 * Flow: user triggers consent -> single message read -> parse -> confirm card -> save on tap.
 * Never auto-posts. Degrades gracefully to paste box on iOS, desktop, or consent denial.
 */

import api from "./api";

export const isAndroidDevice = () => {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent || "");
};

export const isIosDevice = () => {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
};

/**
 * Requests one-time consent to read a single financial alert message.
 * Falls back to paste box on rejection or non-Android devices.
 */
export async function requestSmsUserConsent() {
  // iOS has no SMS User Consent API -> fall back to paste box without error
  if (isIosDevice() || !isAndroidDevice()) {
    return {
      success: false,
      fallbackToPaste: true,
      reason: "SMS User Consent API is only available on Android. Using paste box."
    };
  }

  // Check for native bridge (e.g. Capacitor/Cordova or Android WebView)
  if (typeof window !== "undefined" && window.AndroidSmsUserConsent) {
    try {
      const message = await new Promise((resolve, reject) => {
        window.AndroidSmsUserConsent.requestSms(
          (msg) => resolve(msg),
          (err) => reject(err)
        );
      });

      if (!message) {
        return { success: false, fallbackToPaste: true, reason: "Consent denied" };
      }

      const parseRes = await api.post("/entries/parse", { text: message, source: "sms" });
      return { success: true, parsed: parseRes.data, raw: message };
    } catch (err) {
      // Consent denied or dismissed: degrade gracefully to paste box
      return { success: false, fallbackToPaste: true, reason: "Consent denied by user" };
    }
  }

  // Web OTP API fallback on Android Chrome
  if (typeof window !== "undefined" && "credentials" in navigator && "OTPCredential" in window) {
    try {
      const ac = new AbortController();
      // Timeout after 60 seconds
      const timeoutId = setTimeout(() => ac.abort(), 60000);

      const content = await navigator.credentials.get({
        otp: { transport: ["sms"] },
        signal: ac.signal
      });
      clearTimeout(timeoutId);

      if (content && content.code) {
        const parseRes = await api.post("/entries/parse", { text: content.code, source: "sms" });
        return { success: true, parsed: parseRes.data, raw: content.code };
      }
    } catch (err) {
      // Denied or aborted: degrades gracefully to paste box without error
      return { success: false, fallbackToPaste: true, reason: "Consent denied or timed out" };
    }
  }

  // Default fallback to paste box
  return {
    success: false,
    fallbackToPaste: true,
    reason: "SMS Consent not available on this platform"
  };
}
