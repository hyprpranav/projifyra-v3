import React from "react";

/**
 * ProjifyraLoader Component
 * High-tech animated neon SVG stroke loader spelling "PROJIFYRA"
 * Features dash-array offset animations, rotating linear gradients, and glowing effects.
 *
 * Props:
 * - size: "sm" | "md" | "lg" | "xl" | "compact" (default: "md")
 * - label: string (optional status message beneath the loader)
 * - fullScreen: boolean (renders centered with viewport backdrop)
 * - className: string (custom wrapper class)
 */
export default function ProjifyraLoader({
  size = "md",
  label = "",
  fullScreen = false,
  className = "",
  style = {},
}) {
  // Sizing map for individual letter SVGs
  const sizeMap = {
    compact: 20,
    sm: 20,
    md: 28,
    lg: 38,
    xl: 48,
  };

  const letterSize = sizeMap[size] || 28;

  // Compact mode: just the animated stylized 'P' mark
  const isCompact = size === "compact";

  return (
    <div
      className={`projifyra-loader-container ${fullScreen ? "full-screen" : ""} ${className}`}
      style={style}
      role="status"
      aria-label={label || "Loading"}
    >
      <div className="loader projifyra-loader">
        {/* Shared SVG Linear Gradient Defs with user's animated rotate transform */}
        <svg height="0" width="0" viewBox="0 0 100 100" className="absolute" style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            <linearGradient
              gradientUnits="userSpaceOnUse"
              y2="2"
              x2="0"
              y1="62"
              x1="0"
              id="proj-b"
            >
              <stop stopColor="#1E3A8A" />
              <stop stopColor="#635BFF" offset="1.2" />
            </linearGradient>

            <linearGradient
              gradientUnits="userSpaceOnUse"
              y2="0"
              x2="0"
              y1="64"
              x1="0"
              id="proj-c"
            >
              <stop stopColor="#1D4ED8" />
              <stop stopColor="#7C3AED" offset="0.7" />
              <stop stopColor="#635BFF" offset="1" />
              <animateTransform
                repeatCount="indefinite"
                keySplines=".42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1"
                keyTimes="0; 0.125; 0.25; 0.375; 0.5; 0.625; 0.75; 0.875; 1"
                dur="8s"
                values="0 32 32;-270 32 32;-270 32 32;-540 32 32;-540 32 32;-810 32 32;-810 32 32;-1080 32 32;-1080 32 32"
                type="rotate"
                attributeName="gradientTransform"
              />
            </linearGradient>

            <linearGradient
              gradientUnits="userSpaceOnUse"
              y2="2"
              x2="0"
              y1="62"
              x1="0"
              id="proj-d"
            >
              <stop stopColor="#635BFF" />
              <stop stopColor="#1E40AF" offset="1.4" />
            </linearGradient>
          </defs>
        </svg>

        {/* Letter P */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 100 100"
          width={letterSize}
          height={letterSize}
          className="inline-block projifyra-letter"
        >
          <path
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="10"
            stroke="url(#proj-b)"
            d="M 25,85 L 25,18 L 56,18 A 17,17 0 0 1 73,35 A 17,17 0 0 1 56,52 L 25,52"
            className="dash"
            id="proj-P"
            pathLength="360"
          />
        </svg>

        {!isCompact && (
          <>
            {/* Letter R */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 100 100"
              width={letterSize}
              height={letterSize}
              className="inline-block projifyra-letter"
            >
              <path
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="10"
                stroke="url(#proj-d)"
                d="M 25,85 L 25,18 L 54,18 A 16,16 0 0 1 70,34 A 16,16 0 0 1 54,50 L 25,50 L 48,50 L 75,85"
                className="dash"
                id="proj-R1"
                pathLength="360"
              />
            </svg>

            {/* Letter O (Rotating Pulse) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              style={{ "--rotation-duration": "0ms", "--rotation-direction": "normal" }}
              viewBox="0 0 100 100"
              width={letterSize}
              height={letterSize}
              className="inline-block projifyra-letter"
            >
              <path
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="11"
                stroke="url(#proj-c)"
                d="M 50,15 A 35,35 0 0 1 85,50 A 35,35 0 0 1 50,85 A 35,35 0 0 1 15,50 A 35,35 0 0 1 50,15 Z"
                className="spin"
                id="proj-O"
                pathLength="360"
              />
            </svg>

            {/* Letter J */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 100 100"
              width={letterSize}
              height={letterSize}
              className="inline-block projifyra-letter"
            >
              <path
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="10"
                stroke="url(#proj-b)"
                d="M 35,18 L 75,18 L 75,58 A 25,25 0 0 1 25,62"
                className="dash"
                id="proj-J"
                pathLength="360"
              />
            </svg>

            {/* Letter I */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 100 100"
              width={letterSize}
              height={letterSize}
              className="inline-block projifyra-letter"
            >
              <path
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="10"
                stroke="url(#proj-d)"
                d="M 30,18 L 70,18 L 50,18 L 50,82 L 30,82 L 70,82"
                className="dash"
                id="proj-I"
                pathLength="360"
              />
            </svg>

            {/* Letter F */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 100 100"
              width={letterSize}
              height={letterSize}
              className="inline-block projifyra-letter"
            >
              <path
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="10"
                stroke="url(#proj-b)"
                d="M 25,85 L 25,18 L 75,18 L 25,18 L 25,50 L 65,50"
                className="dash"
                id="proj-F"
                pathLength="360"
              />
            </svg>

            {/* Letter Y */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 100 100"
              width={letterSize}
              height={letterSize}
              className="inline-block projifyra-letter"
            >
              <path
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="10"
                stroke="url(#proj-d)"
                d="M 20,18 L 50,52 L 80,18 L 50,52 L 50,85"
                className="dash"
                id="proj-Y"
                pathLength="360"
              />
            </svg>

            {/* Letter R */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 100 100"
              width={letterSize}
              height={letterSize}
              className="inline-block projifyra-letter"
            >
              <path
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="10"
                stroke="url(#proj-b)"
                d="M 25,85 L 25,18 L 54,18 A 16,16 0 0 1 70,34 A 16,16 0 0 1 54,50 L 25,50 L 48,50 L 75,85"
                className="dash"
                id="proj-R2"
                pathLength="360"
              />
            </svg>

            {/* Letter A */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 100 100"
              width={letterSize}
              height={letterSize}
              className="inline-block projifyra-letter"
            >
              <path
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="10"
                stroke="url(#proj-d)"
                d="M 20,85 L 50,18 L 80,85 L 67,54 L 33,54"
                className="dash"
                id="proj-A"
                pathLength="360"
              />
            </svg>
          </>
        )}
      </div>

      {label && <div className="projifyra-loader-label">{label}</div>}
    </div>
  );
}
