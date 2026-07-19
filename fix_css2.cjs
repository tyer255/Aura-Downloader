const fs = require('fs');
let css = `@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --animate-shimmer: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
/* Driver.js Custom Frosted Glass Theme */
.driver-popover {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 16px !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1) !important;
  color: #1a1a1a !important;
}
.driver-popover-title {
  font-weight: 700 !important;
  font-size: 1.125rem !important;
  margin-bottom: 0.5rem !important;
  color: #111 !important;
}
.driver-popover-description {
  font-size: 0.875rem !important;
  color: #444 !important;
  line-height: 1.5 !important;
}
.driver-popover-footer button {
  background: rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  color: #111 !important;
  border-radius: 8px !important;
  padding: 6px 12px !important;
  font-weight: 600 !important;
  transition: all 0.2s ease !important;
  text-shadow: none !important;
}
.driver-popover-footer button:hover {
  background: rgba(0, 0, 0, 0.1) !important;
}
.driver-popover-arrow {
  border-color: rgba(255, 255, 255, 0.7) !important;
}
.driver-popover-progress-text {
  color: #666 !important;
  font-weight: 600 !important;
}
/* Dark mode overrides if needed - we'll just stick to a light frosted glass since the UI has both, but frosted light works nicely on both */
html.dark .driver-popover {
  background: rgba(30, 30, 30, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
}
html.dark .driver-popover-title { color: #fff !important; }
html.dark .driver-popover-description { color: #ddd !important; }
html.dark .driver-popover-footer button {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
}
html.dark .driver-popover-footer button:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}
html.dark .driver-popover-progress-text { color: #aaa !important; }
`;
fs.writeFileSync('src/index.css', css);
