// File: src/components/footer.jsx
import React from "react";
import { FaLinkedin } from "react-icons/fa";

/**
 * Props:
 *   theme: one of the objects from themes (Light | Dark | Colorful)
 * Usage:
 *   <Footer theme={currentTheme} />
 */
export function Footer({ theme }) {
  const borderClass = theme?.dropdownBorder || "border-slate-300";
  const textClass = theme?.text || "text-slate-900";
  const bgClass = theme?.background || "bg-white";

  return (
    <footer
      className={`mt-10 border-t py-6 text-center text-sm opacity-80 ${borderClass} ${bgClass} ${textClass}`}
    >
      <p className="inline-flex items-center gap-2">
        <span className="opacity-80">Developed by</span>
        <a
          href="https://www.linkedin.com/in/aisha-alajmi/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-semibold
                     transition-colors"
          // use theme variables for link color/hover
          style={{ color: "var(--primary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--primary)")}
          title="Aisha Alajmi on LinkedIn"
        >
          <FaLinkedin size={18} />
          <span>Aisha Alajmi</span>
        </a>
      </p>
    </footer>
  );
}
