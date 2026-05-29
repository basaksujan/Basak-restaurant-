import * as React from 'react';
import { useState } from 'react';
import { X, Lock, User, Sparkles, Building2 } from 'lucide-react';
import { auth, isFirebaseEnabled } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface AdminLoginModalProps {
  onClose: () => void;
  onLoginSuccess: (token: string) => void;
}

export default function AdminLoginModal({ onClose, onLoginSuccess }: AdminLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setShowTroubleshooting(false);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user && user.email === 'sujanbasakk@gmail.com') {
        onLoginSuccess("firebase_admin_token_" + Date.now());
        onClose();
      } else {
        setError(`Access Denied: Only the verified admin sujanbasakk@gmail.com has database write permissions in Firebase.`);
      }
    } catch (err: any) {
      console.error("Firebase Auth Google Error:", err);
      const errorCode = err?.code || '';
      const errMsg = err?.message || '';
      const currentHost = window.location.hostname;

      const isUnauthorizedDomain = errorCode.includes('auth/unauthorized-domain') || 
                                   errorCode.includes('unauthorized-domain') || 
                                   errMsg.includes('unauthorized-domain') || 
                                   errMsg.includes('authDomain') ||
                                   errMsg.includes('unauthorized');

      if (isUnauthorizedDomain) {
        setError(`Google Auth Blocked on ${currentHost}: Unregistered domain. Please go to your Firebase Console under Authentication > Settings > Authorized Domains and add "${currentHost}" to authorise logins from Netlify! Until you add it, Google logins will be blocked.`);
        setShowTroubleshooting(true);
      } else if (errorCode.includes('auth/popup-closed-by-user') || errorCode.includes('cancelled')) {
        setError(`Google Auth popup was closed or cancelled. Please try again or use standard Admin credentials (admin / admin123) below.`);
      } else {
        setError(`Google Sign-In failed. Details: ${err?.code || 'Error'} - ${err?.message || 'Check connection details'}. If you are on Netlify and experiencing problems, toggle Firebase on/off in the Admin Panel or check your domain whitelisting permissions.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      const resp = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        const data = await resp.json();
        onLoginSuccess(data.token);
        onClose();
      } else {
        // Fallback for static hosting like Netlify where POST /api/admin/login doesn't exist
        if (username === 'admin' && password === 'admin123') {
          onLoginSuccess("simulated_bkk_token_" + Date.now());
          onClose();
        } else {
          try {
            const errData = await resp.json();
            setError(errData.error || "Invalid credentials. Try using admin / admin123");
          } catch {
            setError("Invalid credentials. Please use default admin / admin123");
          }
        }
      }
    } catch (err) {
      if (username === 'admin' && password === 'admin123') {
        onLoginSuccess("simulated_bkk_token_" + Date.now());
        onClose();
      } else {
        setError("Connection or server error. Using admin / admin123 allows automatic locally-simulated access!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-700 to-amber-955" />
        
        {/* Header visual branding context */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-950/10 text-amber-950 rounded-xl">
              <Building2 className="w-5 h-5 text-amber-900" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-stone-900 font-sans tracking-tight">
                Secure Administrator Portal
              </h3>
              <p className="text-[10px] text-gray-400">
                Basak Khana Khajana Dashboard
              </p>
            </div>
          </div>

          <button
            id="btn-close-login-modal"
            onClick={onClose}
            className="p-1.5 hover:bg-stone-150 rounded-lg text-stone-400 hover:text-stone-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Inputs form workspace */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-150 text-rose-800 text-[11px] rounded-lg font-bold leading-relaxed whitespace-pre-line">
              {error}
            </div>
          )}

          {showTroubleshooting && (
            <div className="p-4 bg-stone-50 border border-amber-200/60 rounded-xl space-y-3 text-[11px] text-stone-700 leading-relaxed shadow-sm">
              <span className="font-extrabold text-stone-900 border-b border-stone-200 pb-1.5 block flex items-center justify-between text-xs tracking-tight">
                <span>🚀 FIRESTORE & NETLIFY DEPLOYMENT GUIDE:</span>
                <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">Authentication Permission Error</span>
              </span>
              <p className="font-medium text-stone-600">
                You are hosted on <code className="bg-stone-200/60 px-1 rounded font-bold font-mono text-amber-800">{window.location.hostname}</code>. 
                The default project <code className="bg-stone-200/60 px-1 rounded font-bold font-mono">praxis-continuum-mpp0d</code> is a system-generated sandbox managed by Google AI Studio. 
                <strong className="text-stone-900 block mt-1">Because you do not own this sandbox project, you cannot add your Netlify domain to its whitelisted domains.</strong>
              </p>
              
              <div className="border-t border-stone-200/60 pt-2.5 space-y-2">
                <p className="font-bold text-amber-950 uppercase tracking-widest text-[9.5px]">
                  💡 CHOOSE ONE OF THESE TWO EASY SOLUTIONS:
                </p>
                
                <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/40">
                  <span className="font-semibold text-stone-900 block text-[11.5px] mb-1">
                    Option A: Use Offline Sandbox Mode (Recommended & Instant)
                  </span>
                  <p className="text-stone-600 mb-1 leading-normal">
                    You can instantly bypass all Firebase credentials. Simply type <code className="bg-stone-200 px-1 rounded font-bold">admin</code> with password <code className="bg-stone-200 px-1 rounded font-bold">admin123</code> below. 
                    This activates an offline Local Storage sandbox where you can manage items, categories, and setup without any cloud blockers.
                  </p>
                </div>

                <div className="bg-emerald-50/30 p-2.5 rounded-lg border border-emerald-100/60">
                  <span className="font-semibold text-emerald-950 block text-[11.5px] mb-1">
                    Option B: Pair Your Own Custom Free Firebase Project (For Active Syncing)
                  </span>
                  <p className="text-emerald-900/80 mb-2 leading-normal">
                    To back up your menus to the cloud and sync dynamically with customers, run your own free Firebase database:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-emerald-800">
                    <li>Create a project at the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-800 font-extrabold underline hover:text-emerald-955">Firebase Console</a> (free).</li>
                    <li>Enable <strong className="font-bold text-emerald-950">Firestore Database</strong> and <strong className="font-bold text-emerald-950">Google Sign-in Auth</strong>.</li>
                    <li>Under <strong className="font-bold text-emerald-950">Authentication &gt; Settings &gt; Authorized Domains</strong>, click Add and whitelist <code className="bg-white/80 border border-emerald-200 px-1 rounded font-bold text-emerald-900">{window.location.hostname}</code>.</li>
                    <li>Log in here using username <strong className="font-bold">admin</strong> and password <strong className="font-bold">admin123</strong>.</li>
                    <li>Click the <strong className="font-bold">Firebase Cloud Sync</strong> tab in the admin sidebar, paste your own Web SDK config credentials, and click **Save**.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-800 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Staff Note:</span> Use default credentials <code className="bg-amber-100 px-1 rounded font-bold">admin</code> with password <code className="bg-amber-100 px-1 rounded font-bold">admin123</code> to access your kitchen state control metrics.
            </div>
          </div>

          {isFirebaseEnabled ? (
            <div className="space-y-2 pb-2 border-b border-stone-100">
              <button
                id="btn-google-admin-login"
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-stone-900 text-white rounded-xl text-xs font-black transition hover:bg-stone-850 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.86c-.277 1.56-1.602 4.585-6.86 4.585-4.54 0-8.24-3.765-8.24-8.4s3.7-8.4 8.24-8.4c2.58 0 4.307 1.095 5.298 2.045l2.465-2.37C18.435 1.21 15.62 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.795-.085-1.4-.195-1.925H12.24z"/>
                </svg>
                <span>Google Sign-In as Admin</span>
              </button>
              <p className="text-[9px] text-center text-gray-400">
                Authorized for sujanbasakk@gmail.com with instant cross-device product sync
              </p>
            </div>
          ) : (
            <div className="p-3 bg-stone-50 border border-stone-200 text-[10px] text-stone-500 rounded-xl leading-relaxed space-y-1">
              <div className="font-bold text-stone-700 flex items-center gap-1">
                <span>💡 For Multi-Device Live Sync:</span>
              </div>
              <p>
                To make uploaded changes instantly visible on customers' mobiles and other screens, configure the Google Firebase database in your app options. This creates a secure serverless cloud backup.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="admin-username" className="block text-[10px] font-black text-amber-950 uppercase tracking-wider mb-1.5">
              Username ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="admin-username"
                type="text"
                required
                placeholder="e.g. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-[10px] font-black text-amber-950 uppercase tracking-wider mb-1.5">
              Password Security Key
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="admin-password"
                type="password"
                required
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              id="btn-login-cancel-act"
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-amber-900 hover:bg-amber-955 text-white text-xs font-black rounded-xl cursor-pointer shadow transition active:scale-95 disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Access Control"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
