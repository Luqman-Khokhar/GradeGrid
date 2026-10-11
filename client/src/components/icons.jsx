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
