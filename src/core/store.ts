import { State, Action, ActionType, Toast, ToastState } from '../types';
import { createContext, useContext } from 'solid-js';
import { createStore, produce as p } from 'solid-js/store';

export let activeState: ToastState;
export const ToastContext = createContext<ToastState>();

export function getActiveState(): ToastState {
  return new Proxy({} as ToastState, {
    get: (_, property: keyof ToastState) => activeState?.[property],
  });
}

export function useState(): ToastState {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('Toast Context is used outside of tracking scope. Did you forget to wrap your tree in <Toaster>?')
  }

  return context;
}

export function createState(): ToastState {
  const [store, setStore] = createStore<State>({ toasts: [], pausedAt: undefined });
  const queue = new Map<Toast['id'], ReturnType<typeof setTimeout>>();

  function scheduleRemoval(toastId: string, unmountDelay: number): void {
    if (queue.has(toastId)) {
      return;
    };

    const timeout = setTimeout(() => {
      queue.delete(toastId);
      dispatch({ type: ActionType.REMOVE_TOAST, toastId });
    }, unmountDelay);

    queue.set(toastId, timeout);
  }

  function unscheduleRemoval(toastId: string) {
    const timeout = queue.get(toastId);
    queue.delete(toastId);
    timeout && clearTimeout(timeout);
  }

  function dispatch(action: Action): void {
    switch (action.type) {
      case ActionType.ADD_TOAST:
        setStore('toasts', (t) => [action.toast, ...t]);
        break;

      case ActionType.DISMISS_TOAST:
        const { toastId } = action;

        if (toastId) {
          const toastToRemove = store.toasts.find((t) => t.id === toastId);
          if (toastToRemove) scheduleRemoval(toastId, toastToRemove.unmountDelay);
          return setStore(
            'toasts',
            (t) => t.id === toastId,
            p((t) => (t.visible = false))
          );
        }
        store.toasts.forEach((t) => {
          scheduleRemoval(t.id, t.unmountDelay);
        });
        setStore(
          'toasts',
          (t) => t.id !== undefined,
          p((t) => (t.visible = false))
        );
        break;

      case ActionType.REMOVE_TOAST:
        if (!action.toastId) {
          return setStore('toasts', []);
        }
        setStore('toasts', (t) => t.filter((t) => t.id !== action.toastId));
        break;

      case ActionType.UPDATE_TOAST:
        if (action.toast.id) {
          unscheduleRemoval(action.toast.id);
        }

        setStore(
          'toasts',
          (t) => t.id === action.toast.id,
          (t) => ({ ...t, ...action.toast }),
        );
        break;

      case ActionType.UPSERT_TOAST:
        store.toasts.find((t) => t.id === action.toast.id)
          ? dispatch({ type: ActionType.UPDATE_TOAST, toast: action.toast })
          : dispatch({ type: ActionType.ADD_TOAST, toast: action.toast });
        break;

      case ActionType.START_PAUSE:
        setStore(p((s) => {
          s.pausedAt = Date.now();
          s.toasts.forEach((t) => {
            t.paused = true;
          });
        }));
        break;

      case ActionType.END_PAUSE:
        const pauseInterval = action.time - (store.pausedAt || 0);
        setStore(
          p((s) => {
            s.pausedAt = undefined;
            s.toasts.forEach((t) => {
              t.pauseDuration += pauseInterval;
              t.paused = false;
            });
          })
        );
        break;
    }
  }
  activeState = { store, setStore, dispatch };

  return activeState;
}

export function createTimers({ store, dispatch }: ToastState) {
  if (store.pausedAt) return;
  const now = Date.now();

  const timers = store.toasts.map((toast) => {
    if (toast.duration === Infinity) return;

    const durationLeft = (toast.duration || 0) + toast.pauseDuration - (now - toast.createdAt);

    if (durationLeft <= 0) {
      if (toast.visible) {
        dispatch({
          type: ActionType.DISMISS_TOAST,
          toastId: toast.id,
        });
      }
      return;
    }

    return setTimeout(() => {
      dispatch({
        type: ActionType.DISMISS_TOAST,
        toastId: toast.id,
      });
    }, durationLeft);
  });

  return timers;
}
