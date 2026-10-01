/**
 * Global overrides for window.alert / window.confirm / window.prompt.
 *
 * - alert()   → always uses our toast (safe, returns nothing).
 * - confirm() → shows our modal. If called during a click handler,
 *               the original click is replayed on approval so the
 *               caller's `if (confirm(...)) { ... }` branch runs.
 *               If called outside a click (rare), falls back to native.
 * - prompt()  → same strategy as confirm, caching the entered value.
 *
 * Install once at app startup via installNativeOverrides(ui).
 */

const state = {
    installed: false,
    originals: null,
    ui: null,
    lastClickTarget: null,
    inClickDispatch: false,
    bypass: { confirm: false, prompt: false },
    lastPromptValue: null,
    captureHandler: null,
    bubbleHandler: null,
};

export function installNativeOverrides(ui) {
    if (typeof window === 'undefined') return;

    // Allow the UI ref to be refreshed even if already installed
    state.ui = ui;
    if (state.installed) return;

   // Native browser methods throw "Illegal invocation" if called
// without their original `this`. Bind them to window.
state.originals = {
    alert:   window.alert.bind(window),
    confirm: window.confirm.bind(window),
    prompt:  window.prompt.bind(window),
};

    // Track which element was clicked so we can replay it.
    state.captureHandler = (e) => {
        state.lastClickTarget = e.target;
        state.inClickDispatch = true;
    };
    state.bubbleHandler = () => {
        state.inClickDispatch = false;
    };

    document.addEventListener('click', state.captureHandler, true);
    document.addEventListener('click', state.bubbleHandler, false);

    /* ─────────────── alert ─────────────── */

    window.alert = function (message) {
        // alert() returns undefined — safe to make async.
        try {
            state.ui?.toast?.info(message ?? '');
        } catch {
            // If our UI isn't ready, fall back to the native dialog
            state.originals.alert(message);
        }
    };

    /* ─────────────── confirm ─────────────── */

    window.confirm = function (message) {
        // Case 1: this is the replayed call after the user approved.
        if (state.bypass.confirm) {
            state.bypass.confirm = false;
            return true;
        }

        // Case 2: called outside a click handler (useEffect, timer, etc.)
        // → we can't replay, so fall back to the native blocking dialog.
        if (!state.inClickDispatch || !state.lastClickTarget?.isConnected) {
            return state.originals.confirm(message);
        }

        const target = state.lastClickTarget;

        Promise.resolve(
            state.ui?.confirm?.({
                title: 'Please confirm',
                message: message ?? '',
                confirmText: 'Confirm',
                cancelText: 'Cancel',
                variant: 'warning',
            })
        )
            .then((approved) => {
                if (approved && target.isConnected) {
                    state.bypass.confirm = true;
                    target.click();
                }
            })
            .catch(() => {
                // If the UI fails, fall back to native as a last resort.
                state.originals.confirm(message);
            });

        // Caller's if-block sees false and doesn't run — yet.
        return false;
    };

    /* ─────────────── prompt ─────────────── */

    window.prompt = function (message, defaultValue) {
        if (state.bypass.prompt) {
            state.bypass.prompt = false;
            return state.lastPromptValue;
        }

        if (!state.inClickDispatch || !state.lastClickTarget?.isConnected) {
            return state.originals.prompt(message, defaultValue);
        }

        const target = state.lastClickTarget;

        Promise.resolve(
            state.ui?.prompt?.({
                title: 'Input',
                message: message ?? '',
                placeholder: '',
                defaultValue: defaultValue ?? '',
                confirmText: 'Submit',
                cancelText: 'Cancel',
            })
        )
            .then((value) => {
                if (value !== null && value !== undefined && target.isConnected) {
                    state.bypass.prompt = true;
                    state.lastPromptValue = value;
                    target.click();
                }
            })
            .catch(() => {
                state.originals.prompt(message, defaultValue);
            });

        return null;
    };

    state.installed = true;
}

export function uninstallNativeOverrides() {
    if (!state.installed) return;

    if (state.originals) {
        window.alert = state.originals.alert;
        window.confirm = state.originals.confirm;
        window.prompt = state.originals.prompt;
    }

    if (state.captureHandler) {
        document.removeEventListener('click', state.captureHandler, true);
    }
    if (state.bubbleHandler) {
        document.removeEventListener('click', state.bubbleHandler, false);
    }

    state.installed = false;
}
