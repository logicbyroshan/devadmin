import React, { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';

export default function LogoutModal({ onCancel, onConfirmLogout }) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      onConfirmLogout();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#12151f] border border-[#222738] rounded-xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
        {!loggingOut ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-950/40">
              <LogOut className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white">Sign Out Confirmation</h3>
              <p className="text-xs text-neutral-400 mt-1">Are you sure you want to end your current Dev-Admin active session?</p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onCancel}
                className="w-1/2 h-9 px-4 rounded-lg bg-[#0d1018] hover:bg-[#161a28] text-neutral-300 hover:text-white text-xs font-semibold border border-[#222738] transition-all flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="w-1/2 h-9 px-4 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-extrabold transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center"
              >
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <div className="py-6 space-y-3">
            <Loader2 className="w-10 h-10 text-rose-400 animate-spin mx-auto" />
            <h3 className="text-base font-extrabold text-white">Signing Out...</h3>
            <p className="text-xs text-neutral-400">Securing your session tokens and database state.</p>
          </div>
        )}
      </div>
    </div>
  );
}
