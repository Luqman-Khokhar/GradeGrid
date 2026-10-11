// Decorative icons: always paired with visible text or an aria-label on the parent.
const base = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

export const UploadIcon = ({ className = 'size-5' }) => (
  <svg {...base} className={className}>
    <path d="M12 16V4m0 0-4 4m4-4 4 4" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);

export const FileIcon = ({ className = 'size-5' }) => (
  <svg {...base} className={className}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </svg>
);

export const CloseIcon = ({ className = 'size-4' }) => (
  <svg {...base} className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const CheckIcon = ({ className = 'size-4' }) => (
  <svg {...base} className={className}>
    <path d="m5 12 5 5L20 7" />
  </svg>
);

export const AlertIcon = ({ className = 'size-4' }) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4m0 4h.01" />
  </svg>
);

export const DownloadIcon = ({ className = 'size-4' }) => (
  <svg {...base} className={className}>
    <path d="M12 4v12m0 0-4-4m4 4 4-4" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);

export const SunIcon = ({ className = 'size-4' }) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
  </svg>
);

export const MoonIcon = ({ className = 'size-4' }) => (
  <svg {...base} className={className}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </svg>
);

export const MonitorIcon = ({ className = 'size-4' }) => (
  <svg {...base} className={className}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8m-4-4v4" />
  </svg>
);

export const SearchIcon = ({ className = 'size-4' }) => (
  <svg {...base} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
