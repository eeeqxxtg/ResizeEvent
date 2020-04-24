export type IResizeCallBack = () => void;

export const debounce = (fn: (...evt: any) => void, delay = 60) => {
  let timer: any = null;
  return (...rest: any) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...rest);
    }, delay);
  };
};
