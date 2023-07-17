import { defaultContainerStyle } from '../core';
import { ToasterProps } from '..';
import { mergeContainerOptions } from '../util';
import { createEffect, For, onCleanup, Component } from 'solid-js';
import { createState, createTimers, ToastContext } from '../core';
import { ToastContainer } from './';
import { Toast } from '../types';

export const Toaster: Component<ToasterProps> = (props) => {
  const state = createState();

  createEffect(() => {
    mergeContainerOptions(props);
  });

  createEffect(() => {
    const timers = createTimers(state);
    onCleanup(() => {
      if (!timers) return;
      timers.forEach((timer) => timer && clearTimeout(timer));
    });
  });

  return (
    <ToastContext.Provider value={state}>
      {props.children}
      <div
        style={{
          ...defaultContainerStyle,
          ...props.containerStyle,
        }}
        class={props.containerClassName}
      >
        <style>{`.sldt-active{z-index:9999;}.sldt-active>*{pointer-events:auto;}`}</style>
        <For each={state.store.toasts}>{(toast) => <ToastContainer toast={toast as Toast} />}</For>
      </div>
    </ToastContext.Provider>
  );
};
