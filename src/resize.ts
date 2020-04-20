import { IResizeCallBack, debounce } from './utils';

const ResizeObserver = (window as any).ResizeObserver;

const resizelistenerWm = new WeakMap();
const resizeObserverWm = new WeakMap();

const resizeHandler = debounce((entries: any[]) => {
  for (const entry of entries) {
    const listeners = resizelistenerWm.get(entry.target) || [];
    if (listeners.length) {
      listeners.forEach((fn: IResizeCallBack) => fn());
    }
  }
});

export const addResizeListener = (element: HTMLElement, fn: IResizeCallBack) => {
  if (!resizelistenerWm.has(element)) {
    resizelistenerWm.set(element, []);
    const ro = new ResizeObserver(resizeHandler);
    ro.observe(element);
    resizeObserverWm.set(element, ro);
  }
  resizelistenerWm.get(element).push(fn);
};

export const removeResizeListener = (element: HTMLElement, fn: IResizeCallBack) => {
  if (!element || !resizelistenerWm.has(element)) {
    return;
  }
  const lisenters = resizelistenerWm.get(element);
  lisenters.splice(lisenters.indexOf(fn), 1);
  if (!lisenters.length) {
    resizeObserverWm.get(element).disconnect();
    resizelistenerWm.delete(element);
    resizeObserverWm.delete(element);
  }
};
