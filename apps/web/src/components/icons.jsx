const base = {
  display: "inline-block",
  verticalAlign: "middle",
  flexShrink: 0,
};

function Svg({ children, size = 16, color = "currentColor", viewBox = "0 0 24 24", style = {}, strokeWidth = 2, fill = "none" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      style={{ ...base, ...style }}
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function WarningIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 3l10 18H2L12 3z" />
      <path d="M12 9v5" />
      <circle cx="12" cy="17" r="1" fill={props.color || "currentColor"} stroke="none" />
    </Svg>
  );
}

export function MailIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </Svg>
  );
}

export function EyeIcon(props) {
  return (
    <Svg {...props}>
      <path d="M1.5 12s3.5-6 10.5-6 10.5 6 10.5 6-3.5 6-10.5 6-10.5-6-10.5-6z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

export function EyeOffIcon(props) {
  return (
    <Svg {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.2A11.3 11.3 0 0 1 12 6c7 0 10.5 6 10.5 6a18.6 18.6 0 0 1-4 4.5" />
      <path d="M6.1 6.1C3.2 8 1.5 12 1.5 12s3.5 6 10.5 6c1.9 0 3.5-.4 5-1.1" />
      <path d="M14.1 14.1A3 3 0 0 1 9.9 9.9" />
    </Svg>
  );
}

export function CheckIcon(props) {
  return (
    <Svg {...props}>
      <path d="M5 12l4 4 10-10" />
    </Svg>
  );
}

export function XIcon(props) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </Svg>
  );
}

export function SunIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.9 4.9l1.4 1.4" />
      <path d="M17.7 17.7l1.4 1.4" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.9 19.1l1.4-1.4" />
      <path d="M17.7 6.3l1.4-1.4" />
    </Svg>
  );
}

export function MoonIcon(props) {
  return (
    <Svg {...props}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8z" />
    </Svg>
  );
}

export function SearchIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Svg>
  );
}

export function FilterIcon(props) {
  return (
    <Svg {...props}>
      <path d="M3 5h18" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </Svg>
  );
}

export function AttachmentIcon(props) {
  return (
    <Svg {...props}>
      <path d="M21 10.5l-8.5 8.5a5 5 0 1 1-7.1-7.1l8.8-8.8a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 1 1-2.8-2.8l8-8" />
    </Svg>
  );
}

export function CalendarIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 10h18" />
    </Svg>
  );
}

export function TrashIcon(props) {
  return (
    <Svg {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </Svg>
  );
}

export function LogoutIcon(props) {
  return (
    <Svg {...props}>
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
    </Svg>
  );
}

export function LoaderIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 2a10 10 0 0 1 10 10" />
      <path d="M12 22a10 10 0 0 1-10-10" opacity="0.35" />
    </Svg>
  );
}

export function KeyIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h9" />
      <path d="M17 12v3" />
      <path d="M20 12v2" />
    </Svg>
  );
}

export function TrophyIcon(props) {
  return (
    <Svg {...props}>
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4z" />
      <path d="M6 6H4a2 2 0 0 0 0 4h2" />
      <path d="M18 6h2a2 2 0 0 1 0 4h-2" />
      <path d="M12 12v4" />
      <path d="M9 20h6" />
    </Svg>
  );
}

export function LockIcon(props) {
  return (
    <Svg {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </Svg>
  );
}

export function SparklesIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 3l1.2 3.2L16 7.4l-2.8 1.2L12 12l-1.2-3.4L8 7.4l2.8-1.2z" />
      <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z" />
      <path d="M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8z" />
    </Svg>
  );
}

export function GoogleIcon({ size = 18, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ ...base, ...style }}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M12 10.2v4h5.6c-.25 1.3-1 2.4-2.1 3.15l3.25 2.5c1.9-1.75 3-4.35 3-7.45 0-.7-.06-1.37-.18-2.02H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.95-.9 6.6-2.45l-3.25-2.5c-.9.6-2.05.95-3.35.95-2.58 0-4.76-1.74-5.54-4.08l-3.36 2.6C4.73 19.78 8.1 22 12 22z"
      />
      <path
        fill="#4A90E2"
        d="M6.46 13.92A5.98 5.98 0 0 1 6.15 12c0-.67.12-1.32.31-1.92l-3.36-2.6A9.97 9.97 0 0 0 2 12c0 1.6.38 3.1 1.1 4.4l3.36-2.48z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.95c1.47 0 2.78.5 3.82 1.48l2.86-2.86C16.95 2.95 14.7 2 12 2 8.1 2 4.73 4.22 3.1 7.48l3.36 2.6C7.24 7.74 9.42 5.95 12 5.95z"
      />
    </svg>
  );
}
