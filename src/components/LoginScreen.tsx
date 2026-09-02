import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  User, 
  Lock, 
  MapPin, 
  ArrowRight, 
  Languages 
} from "lucide-react";
import { UserProfile, AndonLine, AppTheme, AppLanguage } from "../types";
import { saveSession, DEFAULT_USERS } from "../utils/auth";
import { subscribeMasterOperators, logActivity, IS_DEMO_MODE } from "../lib/firestoreService";
import { getTranslation, TranslationKey } from "../utils/i18n";
import { AppLogo } from "./Logo";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { auth } from "../lib/firebase";
import { sanitizeIdentifier, safeLocalStorageSet } from "../utils/sanitizer";

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  theme: AppTheme;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  lines: AndonLine[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  theme,
  language,
  setLanguage,
  lines,
}) => {
  const [badgeIdOrName, setBadgeIdOrName] = useState<string>("");
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [dbOperators, setDbOperators] = useState<UserProfile[]>([]);

  const isLight = theme === "light";

  const t = (key: TranslationKey, params?: Record<string, string | number>) => 
    getTranslation(language, key, params);

  // Subscribe to real-time master operators from Firestore
  useEffect(() => {
    const unsub = subscribeMasterOperators((operators) => {
      setDbOperators(operators);
    });
    return () => unsub();
  }, []);

  // Autofill selected line if lines are loaded
  useEffect(() => {
    if (lines.length > 0 && !selectedLineId) {
      setSelectedLineId(lines[0].id);
    }
  }, [lines, selectedLineId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const inputClean = badgeIdOrName.trim();
    if (!inputClean) {
      setErrorMessage(language === "en" ? "Please enter NPK, Email, or Badge ID." : "Silakan masukkan NPK, Email, atau Badge ID.");
      return;
    }

    if (!selectedLineId) {
      setErrorMessage(language === "en" ? "Please select a production line." : "Silakan pilih lini produksi.");
      return;
    }

    let matchedUser: UserProfile | undefined;

    if (IS_DEMO_MODE) {
      // Demo identities exist only in offline demo mode. They never participate in
      // cloud authorization and therefore cannot become a production backdoor.
      const allUsers = [...dbOperators];
      DEFAULT_USERS.forEach((demoUser) => {
        if (!allUsers.some((u) => u.badgeId === demoUser.badgeId)) allUsers.push(demoUser);
      });
      matchedUser = allUsers.find((usr) => {
        const identity = [usr.id, usr.badgeId, usr.name, usr.email]
          .some((value) => value?.toLowerCase() === inputClean.toLowerCase());
        return identity && Boolean(usr.pin) && password === usr.pin;
      });
    } else {
      // Cloud mode trusts Firebase Authentication + the server-enforced profile at
      // master_operators/{auth.uid}. No local PIN bypass, auto-registration, or
      // client-side role provisioning is permitted.
      if (!inputClean.includes("@")) {
        setErrorMessage(language === "en"
          ? "Cloud mode requires the account email address."
          : "Mode cloud mewajibkan alamat email akun.");
        return;
      }
      try {
        const credential = await signInWithEmailAndPassword(auth, inputClean.toLowerCase(), password);
        const profileSnap = await getDoc(doc(db, "master_operators", credential.user.uid));
        if (!profileSnap.exists()) {
          await auth.signOut();
          setErrorMessage(language === "en"
            ? "This account has not been provisioned by an administrator."
            : "Akun ini belum diprovisikan oleh administrator.");
          return;
        }
        const profile = profileSnap.data() as UserProfile & { active?: boolean };
        if (profile.active === false) {
          await auth.signOut();
          setErrorMessage(language === "en" ? "This account is disabled." : "Akun ini dinonaktifkan.");
          return;
        }
        matchedUser = { ...profile, id: credential.user.uid, pin: undefined };
      } catch (err) {
        console.warn("Cloud authentication rejected:", err);
        setErrorMessage(language === "en"
          ? "Authentication failed. Check your email and password."
          : "Autentikasi gagal. Periksa email dan password.");
        return;
      }
    }

    if (matchedUser) {
      // Validate and sanitize line ID to prevent storage poisoning (S8475)
      const sanitizedLine = sanitizeIdentifier(selectedLineId);
      const isKnownLine = lines.some((l) => l.id === sanitizedLine);
      const safeLineId = isKnownLine ? sanitizedLine : (lines[0]?.id || "LINE-1");

      // Complete user payload with their selected active line
      const sessionUser: UserProfile = {
        ...matchedUser,
        // Override or inject selected line for this login session
        lineAccess: matchedUser.role === "operator" ? [safeLineId] : matchedUser.lineAccess || ["*"],
      };

      // Store validated and sanitized active line ID inside localStorage
      safeLocalStorageSet("andon_active_login_line_id", safeLineId);

      saveSession(sessionUser);

      // Log successful login
      logActivity(
        "login",
        `User Login: ${sessionUser.name}`,
        `Masuk sebagai ${sessionUser.role.toUpperCase()} di Lini ${safeLineId}.`,
        { name: sessionUser.name, id: sessionUser.id, role: sessionUser.role }
      );

      onLoginSuccess(sessionUser);
    } else {
      setErrorMessage(
        language === "en" 
          ? "Invalid Credentials. Check your NPK / User ID & Password." 
          : "Kredensial Salah. Periksa kembali NPK / User ID & Password Anda."
      );
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative ${
      isLight ? "bg-slate-50" : "bg-neutral-950"
    }`}>
      {/* Dynamic Ambient Background Blur Circles */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className={`w-full max-w-md border rounded-3xl p-8 space-y-6 shadow-2xl relative z-10 transition-colors ${
        isLight ? "bg-white border-slate-200" : "bg-neutral-900 border-neutral-800"
      }`}>
        
        {/* Top Header & Language Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AppLogo size={32} theme={theme} />
            <span className="text-xs font-black text-slate-300 dark:text-neutral-700">|</span>
            <span className={`text-[10px] font-black tracking-widest uppercase ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
              ANDON SYSTEM
            </span>
          </div>

          <button
            onClick={() => setLanguage(language === "id" ? "en" : "id")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all ${
              isLight
                ? "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700"
            }`}
          >
            <Languages className="w-3 h-3" />
            <span>{language === "id" ? "ID" : "EN"}</span>
          </button>
        </div>

        {/* Brand Greeting */}
        <div className="space-y-1.5">
          <h2 className={`text-xl font-black tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
            {language === "id" ? "Selamat Datang di Sistem Andon" : "Welcome to Andon System"}
          </h2>
          <p className={`text-xs ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
            {language === "id" 
              ? "Silakan login menggunakan akun Operator, Leader, atau Admin Anda." 
              : "Please login with your Operator, Leader, or Admin account."}
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* 3-Column Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Column 1: NPK / Nama Operator / User ID */}
          <div>
            <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wide ${
              isLight ? "text-slate-700" : "text-neutral-300"
            }`}>
              {language === "id" ? "NPK / Nama Operator / User ID" : "NPK / Operator Name / User ID"}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={badgeIdOrName}
                onChange={(e) => setBadgeIdOrName(e.target.value)}
                placeholder={language === "id" ? "Contoh: OP-1001 atau Agus Pratama" : "E.g. OP-1001 or Agus Pratama"}
                className={`w-full rounded-xl pl-9 pr-3 py-2.5 text-xs border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  isLight 
                    ? "bg-slate-50 border-slate-300 text-slate-900 focus:bg-white" 
                    : "bg-neutral-950 border-neutral-800 text-white focus:bg-neutral-900"
                }`}
              />
            </div>
          </div>

          {/* Column 2: Line (Dropdown Selection) */}
          <div>
            <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wide ${
              isLight ? "text-slate-700" : "text-neutral-300"
            }`}>
              {language === "id" ? "Pilih Lini Produksi (Line)" : "Select Production Line (Line)"}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <MapPin className="w-4 h-4" />
              </span>
              <select
                required
                value={selectedLineId}
                onChange={(e) => setSelectedLineId(e.target.value)}
                className={`w-full rounded-xl pl-9 pr-3 py-2.5 text-xs border appearance-none focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  isLight 
                    ? "bg-slate-50 border-slate-300 text-slate-900" 
                    : "bg-neutral-950 border-neutral-800 text-neutral-200"
                }`}
              >
                {lines.map((ln) => (
                  <option key={ln.id} value={ln.id}>
                    {ln.name} ({ln.id})
                  </option>
                ))}
                {lines.length === 0 && (
                  <option value="LINE-1">Line 1: Machining & CNC Milling (LINE-1)</option>
                )}
              </select>
            </div>
          </div>

          {/* Column 3: Password / PIN */}
          <div>
            <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wide ${
              isLight ? "text-slate-700" : "text-neutral-300"
            }`}>
              Password / PIN
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                className={`w-full rounded-xl pl-9 pr-3 py-2.5 text-xs border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  isLight 
                    ? "bg-slate-50 border-slate-300 text-slate-900 focus:bg-white" 
                    : "bg-neutral-950 border-neutral-800 text-white focus:bg-neutral-900"
                }`}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2 group"
          >
            <span>{language === "id" ? "Masuk ke Sistem" : "Sign In to System"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {/* Footer info containing defaults */}
        <div className={`pt-4 border-t text-center text-[10px] font-bold tracking-wider uppercase ${
          isLight ? "border-slate-100 text-slate-400" : "border-neutral-800 text-neutral-500"
        }`}>
          <p className="font-sans">
            &copy; {new Date().getFullYear()} {import.meta.env.VITE_APP_COMPANY || "Your Company"} &bull; v{import.meta.env.VITE_APP_VERSION || "1.0.0"}
          </p>
        </div>

      </div>
    </div>
  );
};
