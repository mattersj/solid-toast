import { createSignal, untrack } from 'solid-js';
import { ToasterOptions, Message, ToastType, ToastOptions, Toast, ToastHandler, ActionType, ToastState } from '../types';
import { defaultToasterOptions, defaultToastOptions, defaultTimeouts } from './defaults';
import { generateID } from '../util';
import { useState, getActiveState } from './store';
import { resolveValue, DefaultToastOptions, ToastPromiseMessages } from '../types';

export const [defaultOpts, setDefaultOpts] = createSignal<ToasterOptions>(defaultToasterOptions);

function createHandler(state: ToastState, type?: ToastType): ToastHandler {
  const create = (message: Message, type: ToastType = 'blank', options: ToastOptions): Toast => ({
    ...defaultToastOptions,
    ...defaultOpts().toastOptions,
    ...options,
    type,
    message,
    pauseDuration: 0,
    createdAt: Date.now(),
    visible: true,
    id: options.id || generateID(),
    paused: false,
    style: {
      ...defaultToastOptions.style,
      ...defaultOpts().toastOptions?.style,
      ...options.style,
    },
    duration: options.duration || defaultOpts().toastOptions?.duration || defaultTimeouts[type],
    position: options.position || defaultOpts().toastOptions?.position || defaultOpts().position || defaultToastOptions.position,
  });

  return (message: Message, options: ToastOptions = {}) => {
    return untrack(() => {
      const existingToast = state.store.toasts.find(({ id }) => id === options.id);
      const toast = create(message, type, { ...existingToast, ...options });
      state.dispatch({ type: ActionType.UPSERT_TOAST, toast });

      return toast.id;
    });
  };
}

function createToast(state: ToastState) {
  const toast = (message: Message, options?: ToastOptions) => createHandler(state, 'blank')(message, options);
  toast.error = createHandler(state, 'error');
  toast.success = createHandler(state, 'success');
  toast.loading = createHandler(state, 'loading');
  toast.custom = createHandler(state, 'custom');

  toast.dismiss = (toastId?: string) => state.dispatch({ type: ActionType.DISMISS_TOAST, toastId });
  toast.remove = (toastId?: string) => state.dispatch({ type: ActionType.REMOVE_TOAST, toastId });
  toast.promise = <T>(promise: Promise<T>, msgs: ToastPromiseMessages<T>, options?: DefaultToastOptions) => {
    const id = toast.loading(msgs.loading, options);

    promise
      .then((p) => {
        toast.success(resolveValue(msgs.success, p), { id, ...options });
        return p;
      })
      .catch((e) => toast.error(resolveValue(msgs.error, e), { id, ...options }));

    return promise;
  };

  return toast;
}

export function useToast() {
  const state = useState();
  const toast = createToast(state);

  return { toast };
}

export const toast = createToast(getActiveState());
