function BaseIcon({ children, className = "", size = 20, stroke = "currentColor", fill = "none", strokeWidth = 2 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function UiIcon({ name, className = "", size = 20, color = "currentColor" }) {
  switch (name) {
    case "chevronDown":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <path d="M6 9l6 6 6-6" />
        </BaseIcon>
      );
    case "chat":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <path d="M5 6h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-8l-4 3v-3H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
          <circle cx="9" cy="11.5" r="0.9" fill={color} stroke="none" />
          <circle cx="12" cy="11.5" r="0.9" fill={color} stroke="none" />
          <circle cx="15" cy="11.5" r="0.9" fill={color} stroke="none" />
        </BaseIcon>
      );
    case "astrology":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 4v16M4 12h16" />
          <path d="M6.7 6.7l10.6 10.6M17.3 6.7L6.7 17.3" />
          <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
        </BaseIcon>
      );
    case "parihara":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 4.5l2.5 4.6 5.2.8-3.7 3.5.9 5.1L12 16.3 7.1 18.5l.9-5.1L4.3 9.9l5.2-.8L12 4.5z" />
          <path d="M12 8v6" />
        </BaseIcon>
      );
    case "alarm":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <circle cx="12" cy="13" r="7" />
          <path d="M12 13V9.5M12 13l2.5 1.5" />
          <path d="M7 5.2L5 3.5M17 5.2l2-1.7" />
          <path d="M9 20h6" />
        </BaseIcon>
      );
    case "play":
      return (
        <BaseIcon className={className} size={size} stroke={color} fill={color}>
          <path d="M8 6.5v11l8.5-5.5z" stroke="none" />
        </BaseIcon>
      );
    case "pause":
      return (
        <BaseIcon className={className} size={size} stroke={color} fill={color}>
          <rect x="7.2" y="6.5" width="3.2" height="11" rx="1" stroke="none" />
          <rect x="13.6" y="6.5" width="3.2" height="11" rx="1" stroke="none" />
        </BaseIcon>
      );
    case "month":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <line x1="8" y1="2.5" x2="8" y2="6.5" />
          <line x1="16" y1="2.5" x2="16" y2="6.5" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <circle cx="8" cy="14.5" r="0.8" fill={color} stroke="none" />
          <circle cx="12" cy="14.5" r="0.8" fill={color} stroke="none" />
          <circle cx="16" cy="14.5" r="0.8" fill={color} stroke="none" />
        </BaseIcon>
      );
    case "panchang":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <path d="M6 4h10a3 3 0 0 1 3 3v13H9a3 3 0 0 0-3 3V4z" />
          <path d="M6 4h10a3 3 0 0 1 3 3v13" />
          <path d="M9 9h7M9 12.5h7M9 16h5" />
          <circle cx="18" cy="18.5" r="2" />
        </BaseIcon>
      );
    case "festivals":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <path d="M12 3l2.3 5h5.2l-4.2 3.2 1.6 5.3L12 13.2 7.4 16.5 9 11.2 4.8 8h5.2L12 3z" />
        </BaseIcon>
      );
    case "myTithi":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 20c1.6-3.5 4-5 7-5s5.4 1.5 7 5" />
          <path d="M18.5 6.5v3M17 8h3" />
        </BaseIcon>
      );
    case "kundali":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <path d="M4 4h16v16H4z" />
          <path d="M4 12h16M12 4v16M4 4l16 16M20 4L4 20" />
          <circle cx="12" cy="12" r="1.2" fill={color} stroke="none" />
        </BaseIcon>
      );
    case "matchmaking":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <path d="M9.5 7.5c.8-1.5 3.1-1.8 4.1-.3.8-1.5 3.3-1.1 3.8.5.6 1.8-.8 3.3-2 4.3l-1.8 1.6-1.8-1.6c-1.2-1-2.6-2.5-2-4.5z" />
          <circle cx="7.2" cy="10.2" r="2.1" />
          <path d="M3.8 19.5c.8-2.4 2.3-3.7 4.2-3.7 1.1 0 2.2.4 3.1 1.3" />
        </BaseIcon>
      );
    case "muhurt":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7v5l3 2" />
          <path d="M6.5 4.5l1 1M17.5 4.5l-1 1" />
        </BaseIcon>
      );
    case "hinduTime":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 6v6l4-1" />
          <path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2" />
        </BaseIcon>
      );
    case "about":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10v6" />
          <circle cx="12" cy="7" r="0.8" fill={color} stroke="none" />
        </BaseIcon>
      );
    case "arrowLeft":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <path d="M15 18l-6-6 6-6" />
          <path d="M9 12h10" />
        </BaseIcon>
      );
    case "settings":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1 1 0 0 1 0 1.4l-1 1a1 1 0 0 1-1.4 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1 1 0 0 1-1.4 0l-1-1a1 1 0 0 1 0-1.4l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1 1 0 0 1-1-1v-1.5a1 1 0 0 1 1-1h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1 1 0 0 1 0-1.4l1-1a1 1 0 0 1 1.4 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a1 1 0 0 1 1-1h1.5a1 1 0 0 1 1 1v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1 1 0 0 1 1.4 0l1 1a1 1 0 0 1 0 1.4l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a1 1 0 0 1 1 1v1.5a1 1 0 0 1-1 1h-.2a1 1 0 0 0-.9.6z" />
        </BaseIcon>
      );
    case "compass":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <circle cx="12" cy="12" r="8" />
          <path d="M9.5 14.5l1.8-4.8 4.8-1.8-1.8 4.8-4.8 1.8z" />
        </BaseIcon>
      );
    case "sankalp":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <path d="M12 3.8l1.7 2.9 3.4.6-2.3 2.4.5 3.3L12 11.4 8.7 13l.5-3.3L6.9 7.3l3.4-.6L12 3.8z" />
          <path d="M5.5 18.5c1.2-1.7 2.9-2.7 4.8-2.7h3.4c1.9 0 3.6 1 4.8 2.7" />
        </BaseIcon>
      );
    case "bell":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <path d="M6.5 16h11l-1.2-1.7c-.4-.5-.6-1.2-.6-1.8V10a3.7 3.7 0 0 0-7.4 0v2.5c0 .6-.2 1.3-.6 1.8L6.5 16z" />
          <path d="M10 18a2 2 0 0 0 4 0" />
        </BaseIcon>
      );
    case "menu":
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </BaseIcon>
      );
    default:
      return (
        <BaseIcon className={className} size={size} stroke={color}>
          <circle cx="12" cy="12" r="8" />
        </BaseIcon>
      );
  }
}
