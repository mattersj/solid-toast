import { setDefaultOpts } from '../core';
import { Toast, ToasterOptions, ToastPosition } from '../types';
import { JSX } from 'solid-js';

export const generateID = (() => {
  let count = 0;
  return () => String(++count);
})();

export const mergeContainerOptions = (props: ToasterOptions) => {
  setDefaultOpts((s) => ({
    containerClassName: props.containerClassName ?? s.containerClassName,
    containerStyle: props.containerStyle ?? s.containerStyle,
    gutter: props.gutter ?? s.gutter,
    position: props.position ?? s.position,
    toastOptions: {
      ...props.toastOptions,
    },
  }));
};

export const getToastWrapperStyles = (position: ToastPosition, offset: number): JSX.CSSProperties => {
  const top = position.includes('top');
  const verticalStyle: JSX.CSSProperties = top
    ? { top: 0, 'margin-top': `${offset}px` }
    : { bottom: 0, 'margin-bottom': `${offset}px` };
  const horizontalStyle: JSX.CSSProperties = position.includes('center')
    ? { 'justify-content': 'center' }
    : position.includes('right')
    ? { 'justify-content': 'flex-end' }
    : {};
  return {
    left: 0,
    right: 0,
    display: 'flex',
    position: 'absolute',
    transition: `all 230ms cubic-bezier(.21,1.02,.73,1)`,
    ...verticalStyle,
    ...horizontalStyle,
  };
};

export const getToastYDirection = (toast: Toast, defaultPos: ToastPosition) => {
  const position = toast.position || defaultPos;
  const top = position.includes('top');
  return top ? 1 : -1;
};
