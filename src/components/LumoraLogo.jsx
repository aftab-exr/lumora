"use client";

export default function LumoraLogo({ size = "md" } = {}) {
  const sizes = {
    sm: { mark: 16, font: "text-xs", gap: "gap-1.5" },
    md: { mark: 18, font: "text-sm", gap: "gap-2" },
  };

  const { mark, font, gap } = sizes[size] ?? sizes.md;

  return (
    <span className={`inline-flex items-center ${gap} font-sans font-semibold tracking-tight text-[#F3F4F6]`}>
      <svg
        width={mark}
        height={mark}
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M9 1 L17 16 H1 L9 1 Z"
          stroke="#F3F4F6"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="15.2" r="1.1" fill="#10B981" />
      </svg>
      <span className={font}>Lumora</span>
    </span>
  );
}