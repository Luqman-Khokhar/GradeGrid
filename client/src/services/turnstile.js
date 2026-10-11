// Cloudflare Turnstile: proves a request comes from a person using the app, not a script.
// Off when VITE_TURNSTILE_SITE_KEY is not set (the server must then leave TURNSTILE_SECRET_KEY unset too).
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const LOAD_ERROR = 'Could not load the verification check. Check your connection and try again.';
const FAIL_ERROR = 'Verification failed. Reload the page and try again.';

let scriptPromise = null;
let widgetId = null;
let pending = null;

const loadScript = () =>
  (scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(new Error(LOAD_ERROR));
    };
    document.head.append(script);
  }));

const settle = (action, value) => {
  const current = pending;
  pending = null;
  current?.[action](value);
};

/** A fresh single-use token for one API request, or null when Turnstile is off. */
export const getTurnstileToken = async () => {
  if (!SITE_KEY) return null;
  const turnstile = await loadScript();

  return new Promise((resolve, reject) => {
    pending = { resolve, reject };
    if (widgetId === null) {
      // Only shows itself when Cloudflare needs the person to interact.
      const container = document.createElement('div');
      container.className = 'fixed bottom-4 right-4 z-50';
      document.body.append(container);
      widgetId = turnstile.render(container, {
        sitekey: SITE_KEY,
        execution: 'execute',
        appearance: 'interaction-only',
        callback: (token) => settle('resolve', token),
        'error-callback': () => settle('reject', new Error(FAIL_ERROR)),
        'timeout-callback': () => settle('reject', new Error(FAIL_ERROR)),
      });
    } else {
      turnstile.reset(widgetId);
    }
    turnstile.execute(widgetId);
  });
};
