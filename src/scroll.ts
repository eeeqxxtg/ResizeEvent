/*
* Detect Element Resize
*
* modefied from https://github.com/sdecima/javascript-detect-element-resize
* Sebastian Decima
*
* version: 0.5.3
**/

import { IResizeCallBack } from './utils';

type IResizeElement = HTMLElement & {
  __resizeTriggers__: HTMLElement | null;
  __resizeLast__: {
    width?: number,
    height?: number,
  };
  __resizeRAF__: any;
  __resizeListeners__: IResizeCallBack[];
};

const attachEvent = (document as any).attachEvent;
let stylesCreated = false;

const requestFrame = window.requestAnimationFrame ||
  (window as any).mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame || (fn => window.setTimeout(fn, 20));

const cancelFrame = window.cancelAnimationFrame ||
  (window as any).mozCancelAnimationFrame ||
  window.webkitCancelAnimationFrame ||
  window.clearTimeout;

const resetTriggers = (element: IResizeElement) => {
  const triggers = element.__resizeTriggers__ as HTMLElement;
  const expand = triggers.firstElementChild as HTMLElement;
  const expandChild = expand.firstElementChild as HTMLElement;
  const contract = triggers.lastElementChild as HTMLElement;

  contract.scrollLeft = contract.scrollWidth;
  contract.scrollTop = contract.scrollHeight;
  expandChild!.style.width = expand.offsetWidth + 1 + 'px';
  expandChild.style.height = expand.offsetHeight + 1 + 'px';
  expand.scrollLeft = expand.scrollWidth;
  expand.scrollTop = expand.scrollHeight;
};

const checkTriggers = (element: IResizeElement) => element.offsetWidth !== element.__resizeLast__.width ||
  element.offsetHeight !== element.__resizeLast__.height;

function scrollListener(this: IResizeElement, e: Event) {
  const element = this;
  resetTriggers(element);
  if (element.__resizeRAF__) {
    cancelFrame(element.__resizeRAF__);
  }
  element.__resizeRAF__ = requestFrame(() => {
    if (checkTriggers(element)) {
      element.__resizeLast__.width = element.offsetWidth;
      element.__resizeLast__.height = element.offsetHeight;
      element.__resizeListeners__.forEach(fn => fn.call(element));
    }
  });
}

const getAnimateParams = () => {
  /* Detect CSS Animations support to detect element display/re-attach */
  let animation = false;
  // let animationstring = 'animation';
  let keyframeprefix = '';
  let animstartevent = 'animationstart';
  const domPrefixes = 'Webkit Moz O ms'.split(' ');
  const startEvents = 'webkitAnimationStart animationstart oAnimationStart MSAnimationStart'.split(' ');
  let pfx = '';

  const elm = document.createElement('fakeelement');
  if (elm.style.animationName !== undefined) {
    animation = true;
  }

  if (animation === false) {
    for (let i = 0; i < domPrefixes.length; i++) {
      if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
        pfx = domPrefixes[i];
        // animationstring = pfx + 'Animation';
        keyframeprefix = '-' + pfx.toLowerCase() + '-';
        animstartevent = startEvents[i];
        animation = true;
        break;
      }
    }
  }

  const animName = 'resizeanim';
  // tslint:disable-next-line:max-line-length
  const animKeyframes = '@' + keyframeprefix + 'keyframes ' + animationName + ' { from { opacity: 0; } to { opacity: 0; } } ';
  const animStyle = keyframeprefix + 'animation: 1ms ' + animationName + '; ';

  return {
    animationName: animName,
    animationKeyframes: animKeyframes,
    animationStyle: animStyle,
    animationstartevent: animstartevent,
  };
};

const { animationKeyframes, animationStyle, animationstartevent, animationName } = getAnimateParams();

const createStyles = () => {
  if (!stylesCreated) {
    // opacity:0 works around a chrome bug https://code.google.com/p/chromium/issues/detail?id=286360
    const css = `
            ${animationKeyframes}
            .resize-triggers {
                ${animationStyle}
                visibility: hidden;
                opacity: 0;
                z-index: -1;
                pointer-events: none;
            }
            .resize-triggers,
            .resize-triggers > div,
            .contract-trigger:before {
                content: \" \";
                display: block;
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 100%;
                overflow: hidden;
            }
            .resize-triggers > div {
                background: #eee;
                overflow: auto;
            }
            .contract-trigger:before {
                width: 200%;
                height: 200%;
            }
        `;
    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.type = 'text/css';

    if ((style as any).styleSheet) {
      (style as any).styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
    stylesCreated = true;
  }
};

export const addResizeListener = (el: HTMLElement, fn: IResizeCallBack) => {
  const element = el as IResizeElement;
  if (attachEvent) {
    (element as any).attachEvent('onresize', fn);
  } else {
    if (!element.__resizeTriggers__) {
      if (getComputedStyle(element).position === 'static') {
        element.style.position = 'relative';
      }
      createStyles();
      element.__resizeLast__ = {};
      element.__resizeListeners__ = [];
      element.__resizeTriggers__ = document.createElement('div')
      element.__resizeTriggers__.className = 'resize-triggers';
      element.__resizeTriggers__.innerHTML = `
        <div class="expand-trigger">
            <div></div>
        </div>
        <div class="contract-trigger"></div>
      `;
      element.appendChild(element.__resizeTriggers__);
      resetTriggers(element);
      element.addEventListener('scroll', scrollListener, true);

      /* Listen for a css animation to detect element display/re-attach */
      if (animationstartevent) {
        element.__resizeTriggers__.addEventListener(animationstartevent, (e: any) => {
          if (e.animationName === animationName) {
            resetTriggers(element);
          }
        });
      }
    }
    element.__resizeListeners__.push(fn);
  }
};

export const removeResizeListener = (el: HTMLElement, fn: IResizeCallBack) => {
  const element = el as IResizeElement;
  if (attachEvent) {
    (element as any).detachEvent('onresize', fn);
  } else {
    element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn), 1);
    if (!element.__resizeListeners__.length) {
      element.removeEventListener('scroll', scrollListener);
      if (element.__resizeTriggers__) {
        element.removeChild(element.__resizeTriggers__);
        element.__resizeTriggers__ = null;
      }
    }
  }
};
