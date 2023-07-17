import { createMemo, onMount, Component } from 'solid-js';
import { ToastContainerProps } from '../';
import { defaultOpts, defaultToastOptions, defaultToasterOptions, useState } from '../core';
import { ActionType, Toast, ToastPosition, resolveValue } from '../types';
import { getToastWrapperStyles } from '../util';
import { ToastBar } from './ToastBar';

export const ToastContainer: Component<ToastContainerProps> = (props) => {
  const { store, dispatch } = useState();

  const getWrapperYAxisOffset = (position: ToastPosition): number => {
    const gutter = defaultOpts().gutter || defaultToasterOptions.gutter || 8;
    const toasts = store.toasts.filter((t) => (t.position || position) === position && t.height);
    const index = toasts.findIndex((t) => t.id === props.toast.id);
    const { length } = toasts.filter((toast, i) => i < index && toast.visible);

    return toasts
      .slice(0, length)
      .reduce((acc, t) => acc + gutter + (t.height || 0), 0);
  };

  const updateHeight = (element: HTMLDivElement) => {
    const { height } = element.getBoundingClientRect();
    if (height !== props.toast.height) {
      const toast: Partial<Toast> = { id: props.toast.id, height };
      dispatch({ type: ActionType.UPDATE_TOAST, toast });
    }
  };

  const calculatePosition = () => {
    const position = props.toast.position || defaultToastOptions.position;
    const offset = getWrapperYAxisOffset(position);
    const positionStyle = getToastWrapperStyles(position, offset);

    return positionStyle;
  };

  const positionStyle = createMemo(() => calculatePosition());

  let el: HTMLDivElement;
  onMount(() => updateHeight(el));

  return (
    <div
      ref={el!}
      style={positionStyle()}
      class={props.toast.visible ? 'sldt-active' : ''}
      onMouseEnter={() =>
        dispatch({
          type: ActionType.START_PAUSE,
          time: Date.now(),
        })
      }
      onMouseLeave={() =>
        dispatch({
          type: ActionType.END_PAUSE,
          time: Date.now(),
        })
      }
    >
      {props.toast.type === 'custom' ? (
        resolveValue(props.toast.message, props.toast)
      ) : (
        <ToastBar toast={props.toast} position={props.toast.position || defaultToastOptions.position} />
      )}
    </div>
  );
};
