import {
  addResizeListener as addScrollResize,
  removeResizeListener as removeScrollResize
} from './scroll';

import {
  addResizeListener as addResize,
  removeResizeListener as removeResize
} from './resize';

const supportResizeObserver = (window as any).ResizeObserver !== undefined;

export const addResizeListener = supportResizeObserver ? addResize : addScrollResize;
export const removeResizeListener = supportResizeObserver ? removeResize : removeScrollResize;
