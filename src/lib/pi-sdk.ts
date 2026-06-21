// Shared Pi SDK loader/initializer. Keeps a single Pi.init() promise.

type PiAuthResult = {
  accessToken: string;
  user: { uid: string; username: string };
};

declare global {
  interface Window {
    Pi?: {
      init: (opts: { version: string; sandbox?: boolean }) => Promise<void> | void;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound: (payment: unknown) => void,
      ) => Promise<PiAuthResult>;
    };
  }
}

const SDK_SRC = "https://sdk.minepi.com/pi-sdk.js";

function loadPiSdk(): Promise<NonNullable<Window["Pi"]>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Pi SDK requires a browser"));
  }
  if (window.Pi) return Promise.resolve(window.Pi);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SDK_SRC}"]`,
    );
    const onReady = () => {
      if (window.Pi) resolve(window.Pi);
      else reject(new Error("Pi SDK loaded but window.Pi missing"));
    };
    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Pi SDK")),
        { once: true },
      );
      return;
    }
    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.async = true;
    script.onload = onReady;
    script.onerror = () => reject(new Error("Failed to load Pi SDK"));
    document.head.appendChild(script);
  });
}

let initPromise: Promise<NonNullable<Window["Pi"]>> | null = null;
export function ensurePiReady(): Promise<NonNullable<Window["Pi"]>> {
  if (!initPromise) {
    initPromise = loadPiSdk().then(async (Pi) => {
      await Promise.resolve(Pi.init({ version: "2.0" }));
      return Pi;
    });
  }
  return initPromise;
}
