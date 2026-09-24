// ─────────────────────────────────────────────────────────────
// useAuthGate hook
//
// Intercepts any action that requires authentication.
// If the user is not logged in, stores the intended action
// and opens the auth gate modal instead.
// After successful auth, the stored action is replayed.
//
// Usage:
//   const { gate, AuthGateModal } = useAuthGate();
//
//   // Anywhere a protected action would fire:
//   gate("viewDetails", listingId, () => {
//     router.push(`/marketplace/${listingId}`);
//   });
// ─────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import { getStoredUser } from "@/lib/api-client";

export type GateAction =
  | "viewDetails"
  | "placeOrder"
  | "contact"
  | "publish"
  | "wishlist"
  | "filter";

export interface PendingAction {
  type:      GateAction;
  listingId?: string;
  callback?: () => void;
}

export interface AuthGateState {
  open:          boolean;
  pendingAction: PendingAction | null;
}

export interface UseAuthGateReturn {
  gateState:    AuthGateState;
  /** Call this to intercept any protected action */
  gate:         (type: GateAction, listingId?: string, callback?: () => void) => void;
  /** Call this when auth succeeds — replays the pending callback */
  onAuthSuccess: () => void;
  /** Close the gate modal */
  closeGate:    () => void;
  /** True when the user is authenticated */
  isAuthed:     boolean;
}

export function useAuthGate(): UseAuthGateReturn {
  const [gateState, setGateState] = useState<AuthGateState>({
    open: false,
    pendingAction: null,
  });

  // Check auth on every call — not just mount — so it picks up
  // localStorage changes from the auth modal
  const isAuthed = typeof window !== "undefined" && !!getStoredUser();

  const gate = useCallback(
    (type: GateAction, listingId?: string, callback?: () => void) => {
      // Re-check here in case user just logged in
      if (typeof window !== "undefined" && getStoredUser()) {
        // Already authed — run the callback directly
        callback?.();
        return;
      }
      // Not authed — save the intended action and open modal
      setGateState({ open: true, pendingAction: { type, listingId, callback } });
    },
    []
  );

  const onAuthSuccess = useCallback(() => {
    const cb = gateState.pendingAction?.callback;
    setGateState({ open: false, pendingAction: null });
    // Replay the original action after a brief tick so auth state settles
    if (cb) setTimeout(cb, 100);
  }, [gateState.pendingAction]);

  const closeGate = useCallback(() => {
    setGateState({ open: false, pendingAction: null });
  }, []);

  return { gateState, gate, onAuthSuccess, closeGate, isAuthed };
}
