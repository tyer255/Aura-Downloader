import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Shield, ExternalLink, Check, Sparkles, AlertTriangle, HelpCircle } from 'lucide-react';
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

  const points = [
    { text: "This tool is for personal, educational, and non-commercial use only.", color: "text-blue-500 bg-blue-500/10" },
    { text: "You must not download copyrighted material without permission from the owner.", color: "text-amber-500 bg-amber-500/10" },
    { text: "We do not host, clone, or store any media on our servers.", color: "text-emerald-500 bg-emerald-500/10" },
    { text: "We are not affiliated with Instagram, Pinterest, X, YouTube, or any other platforms.", color: "text-rose-500 bg-rose-500/10" }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999999] flex items-center justify-center px-4 overflow-y-auto py-8">
          {/* Main Blur Backdrop overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={clsx(
              "absolute inset-0 backdrop-blur-2xl transition-all duration-500",
              isLight ? "bg-white/40" : "bg-black/60"
            )}
          />

          {/* Premium Ambient Background Glows behind the card to create massive modern glass depth */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className="absolute w-[350px] h-[350px] rounded-full bg-blue-500/15 blur-[100px] -translate-x-20 -translate-y-20 pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute w-[300px] h-[300px] rounded-full bg-[#ff1e42]/10 blur-[100px] translate-x-20 translate-y-20 pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className={clsx(
              "relative w-full max-w-lg rounded-[2.5rem] border overflow-hidden flex flex-col max-h-[85vh] backdrop-blur-3xl shadow-[0_32px_100px_rgba(0,0,0,0.4)]",
              isLight 
                ? "bg-white/70 border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08)]" 
                : "bg-neutral-950/75 border-white/[0.08]"
            )}
          >
            {/* Glossy diagonal reflection shine */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />

            {/* Glowing top line accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-80" />

            {/* Header section with Premium design */}
            <div className={clsx(
              "px-8 py-6 border-b flex items-center justify-between relative",
              isLight ? "border-black/5" : "border-white/5"
            )}>
              <div className="flex items-center gap-3.5">
                <div className={clsx(
                  "p-3 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden",
                  isLight ? "bg-blue-500/10 text-blue-600" : "bg-blue-500/20 text-blue-400"
                )}>
                  {/* Internal ambient glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20" />
                  <Shield className="w-5 h-5 relative z-10" />
                </div>
                <div className="flex flex-col">
                  <h2 className={clsx("text-xl font-bold tracking-tight leading-none mb-1", isLight ? "text-neutral-900" : "text-white")}>
                    Terms & Conditions
                  </h2>
                  <span className="text-[10px] tracking-wider font-extrabold uppercase text-blue-500">CONSENT REQUIRED</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SECURE
              </div>
            </div>

            {/* Content section */}
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 relative space-y-6">
              <p className={clsx("text-sm leading-relaxed font-semibold", isLight ? "text-neutral-700" : "text-neutral-300")}>
                Please read and accept our Terms & Conditions and Privacy Policy before using the app. By tapping <span className="text-blue-500 font-bold">'I Agree'</span>, you confirm that you have read and accepted them.
              </p>
              
              {/* Premium Checklist container */}
              <div className="space-y-3">
                <span className={clsx("text-[10px] font-black uppercase tracking-widest block mb-1", isLight ? "text-neutral-400" : "text-neutral-500")}>
                  Important Guidelines & Disclaimers:
                </span>
                
                {points.map((point, idx) => (
                  <div 
                    key={idx}
                    className={clsx(
                      "flex items-start gap-3.5 p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5",
                      isLight 
                        ? "bg-white/50 border-neutral-200/50 hover:bg-white hover:border-neutral-300/80 shadow-sm" 
                        : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]"
                    )}
                  >
                    <div className={clsx("p-1.5 rounded-xl shrink-0 flex items-center justify-center", point.color)}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <p className={clsx("text-xs leading-relaxed font-medium", isLight ? "text-neutral-600" : "text-neutral-300")}>
                      {point.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Document Clickable Links */}
              <div className="flex flex-col sm:flex-row gap-3 font-semibold tracking-tight">
                <Link to="/terms" target="_blank" className={clsx(
                  "flex-1 flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group/link",
                  isLight 
                    ? "border-neutral-200 bg-white/40 hover:bg-white hover:border-blue-400 hover:shadow-md text-neutral-700 hover:text-blue-600" 
                    : "border-white/[0.05] bg-white/[0.01] hover:bg-white/5 hover:border-blue-500/40 text-neutral-300 hover:text-blue-400"
                )}>
                  <span className="flex items-center gap-3">
                    <FileText className="w-4 h-4 opacity-70 group-hover/link:opacity-100 group-hover/link:scale-105 transition-all" /> 
                    Terms of Service
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover/link:opacity-80 transition-opacity" />
                </Link>
                
                <Link to="/privacy-policy" target="_blank" className={clsx(
                  "flex-1 flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group/link",
                  isLight 
                    ? "border-neutral-200 bg-white/40 hover:bg-white hover:border-blue-400 hover:shadow-md text-neutral-700 hover:text-blue-600" 
                    : "border-white/[0.05] bg-white/[0.01] hover:bg-white/5 hover:border-blue-500/40 text-neutral-300 hover:text-blue-400"
                )}>
                  <span className="flex items-center gap-3">
                    <Shield className="w-4 h-4 opacity-70 group-hover/link:opacity-100 group-hover/link:scale-105 transition-all" /> 
                    Privacy Policy
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover/link:opacity-80 transition-opacity" />
                </Link>
              </div>

              {/* Checkbox section */}
              <label className={clsx(
                "flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer select-none group/checkbox transition-all duration-300",
                agreed 
                  ? isLight ? "bg-blue-50/40 border-blue-200/60" : "bg-blue-500/5 border-blue-500/20"
                  : isLight ? "bg-white/20 border-neutral-200/50" : "bg-white/[0.01] border-white/[0.03]"
              )}>
                <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <div className={clsx(
                    "w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center shadow-sm shrink-0",
                    agreed 
                      ? "border-blue-500 bg-blue-600 shadow-blue-500/30 scale-105" 
                      : isLight 
                        ? "border-neutral-400 bg-white group-hover/checkbox:border-blue-500" 
                        : "border-neutral-500 bg-neutral-900 group-hover/checkbox:border-blue-400"
                  )}>
                    <AnimatePresence>
                      {agreed && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 22 }}
                        >
                          <Check className="w-3.5 h-3.5 text-white stroke-[3.5px]" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <span className={clsx(
                  "text-xs font-bold leading-relaxed transition-colors", 
                  agreed 
                    ? isLight ? "text-blue-900" : "text-blue-300" 
                    : isLight ? "text-neutral-700 group-hover/checkbox:text-neutral-900" : "text-neutral-300 group-hover/checkbox:text-white"
                )}>
                  I have read and agree to the Terms & Conditions and Privacy Policy
                </span>
              </label>
            </div>

            {/* Action buttons footer */}
            <div className={clsx(
              "p-6 border-t flex flex-col sm:flex-row gap-3 relative z-10",
              isLight ? "border-black/5" : "border-white/5"
            )}>
              <button
                onClick={onDecline}
                className={clsx(
                  "flex-1 px-5 py-4 rounded-2xl font-bold text-xs transition-all duration-300 border shadow-sm cursor-pointer",
                  isLight 
                    ? "border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-600" 
                    : "border-white/[0.05] bg-white/[0.02] text-neutral-400 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                Exit App
              </button>
              
              <button
                onClick={onAccept}
                disabled={!agreed}
                className={clsx(
                  "flex-1 px-5 py-4 rounded-2xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer",
                  agreed 
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0" 
                    : isLight 
                      ? "bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200/50"
                      : "bg-white/[0.03] text-neutral-600 cursor-not-allowed border border-white/[0.03]"
                )}
              >
                <span>I Agree & Continue</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

