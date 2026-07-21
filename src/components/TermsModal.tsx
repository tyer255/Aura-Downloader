import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Shield, ExternalLink, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

interface TermsModalProps {
  isOpen: boolean;
  isLight: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function TermsModal({ isOpen, isLight, onAccept, onDecline }: TermsModalProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999999] flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={clsx(
              "absolute inset-0 backdrop-blur-xl transition-all duration-500",
              isLight ? "bg-white/30" : "bg-black/50"
            )}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={clsx(
              "relative w-full max-w-md rounded-[2.5rem] border overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-2xl",
              isLight 
                ? "bg-white/60 border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]" 
                : "bg-[#0a0a0c]/70 border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)]"
            )}
          >
            {/* Glossy highlight effect on top edge */}
            <div className={clsx(
              "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50"
            )} />

            <div className={clsx(
              "px-8 py-6 border-b flex items-center justify-between",
              isLight ? "border-black/5" : "border-white/5"
            )}>
              <div className="flex items-center gap-3">
                <div className={clsx(
                  "p-2.5 rounded-2xl flex items-center justify-center shadow-inner",
                  isLight ? "bg-blue-500/10 text-blue-600" : "bg-blue-500/20 text-blue-400"
                )}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className={clsx("text-xl font-bold tracking-tight", isLight ? "text-neutral-900" : "text-white")}>
                  Terms & Conditions
                </h2>
              </div>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 relative">
              <p className={clsx("text-sm mb-6 leading-relaxed font-medium", isLight ? "text-neutral-600" : "text-neutral-300")}>
                Please read and accept our Terms & Conditions and Privacy Policy before using the app. By tapping 'I Agree', you confirm that you have read and accepted them.
              </p>
              
              <div className={clsx(
                "p-5 rounded-3xl mb-7 text-sm space-y-3 border backdrop-blur-md shadow-sm",
                isLight ? "bg-white/40 border-white/60 text-neutral-700" : "bg-white/5 border-white/5 text-neutral-300"
              )}>
                 <p className="font-bold flex items-center gap-2 tracking-tight">
                   Important Points:
                 </p>
                 <ul className="list-disc pl-4 space-y-2.5 text-xs opacity-90 leading-relaxed font-medium">
                    <li>This tool is for personal, educational, and non-commercial use only.</li>
                    <li>You must not download copyrighted material without permission from the owner.</li>
                    <li>We do not host or store any media on our servers.</li>
                    <li>We are not affiliated with Instagram, Pinterest, X, YouTube, or any other supported platforms.</li>
                 </ul>
              </div>

              <div className="flex flex-col gap-3 text-sm font-semibold tracking-tight">
                <Link to="/terms" target="_blank" className={clsx(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                  isLight 
                    ? "border-black/5 bg-white/30 hover:bg-white/60 hover:shadow-sm text-neutral-700" 
                    : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-neutral-200"
                )}>
                  <span className="flex items-center gap-3"><FileText className="w-4 h-4 opacity-70" /> Terms & Conditions</span>
                  <ExternalLink className="w-4 h-4 opacity-40" />
                </Link>
                <Link to="/privacy-policy" target="_blank" className={clsx(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                  isLight 
                    ? "border-black/5 bg-white/30 hover:bg-white/60 hover:shadow-sm text-neutral-700" 
                    : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-neutral-200"
                )}>
                  <span className="flex items-center gap-3"><Shield className="w-4 h-4 opacity-70" /> Privacy Policy</span>
                  <ExternalLink className="w-4 h-4 opacity-40" />
                </Link>
              </div>

              <label className="flex items-start gap-4 mt-8 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input 
                    type="checkbox" 
                    className="sr-only"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <div className={clsx(
                    "w-6 h-6 rounded-xl border-2 transition-all duration-300 flex items-center justify-center shadow-sm",
                    agreed 
                      ? "border-blue-500 bg-blue-500 shadow-blue-500/30" 
                      : isLight 
                        ? "border-black/10 bg-white group-hover:border-blue-400" 
                        : "border-white/20 bg-black/50 group-hover:border-blue-400"
                  )}>
                    <AnimatePresence>
                      {agreed && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <span className={clsx("text-sm font-medium leading-tight", isLight ? "text-neutral-700" : "text-neutral-300")}>
                  I have read and agree to the Terms & Conditions
                </span>
              </label>
            </div>

            <div className={clsx(
              "p-6 border-t flex flex-col sm:flex-row gap-4",
              isLight ? "border-black/5" : "border-white/5"
            )}>
              <button
                onClick={onDecline}
                className={clsx(
                  "flex-1 px-5 py-4 rounded-2xl font-bold text-sm transition-all duration-300 border shadow-sm",
                  isLight 
                    ? "border-black/5 bg-white/50 text-neutral-700 hover:bg-white" 
                    : "border-white/5 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white"
                )}
              >
                Exit App
              </button>
              <button
                onClick={onAccept}
                disabled={!agreed}
                className={clsx(
                  "flex-1 px-5 py-4 rounded-2xl font-bold text-sm transition-all duration-300",
                  agreed 
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40" 
                    : isLight 
                      ? "bg-neutral-200/50 text-neutral-400 cursor-not-allowed border border-neutral-200/50"
                      : "bg-white/5 text-neutral-500 cursor-not-allowed border border-white/5"
                )}
              >
                I Agree
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
