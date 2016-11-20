import * as log from 'loglevel';
import * as Browser from 'bowser';
import Environment from './environment.js';
import IndexedDb from './indexedDb';
import Database from './Database';
import PushNotSupportedError from "./errors/PushNotSupportedError";

export function isArray(variable) {
  return Object.prototype.toString.call( variable ) === '[object Array]';
}

var decodeTextArea = null;
export function decodeHtmlEntities(text) {
  if (Environment.isBrowser()) {
    if (!decodeTextArea) {
      decodeTextArea = document.createElement("textarea");
    }
  }
  if (decodeTextArea) {
    decodeTextArea.innerHTML = text;
    return decodeTextArea.value;
  } else {
    // Not running in a browser environment, text cannot be decoded
    return text;
  }
}

export function isPushNotificationsSupported () {
  if (Browser.ios || Browser.ipod || Browser.iphone || Browser.ipad)
    return false;

  if (Browser.msedge || Browser.msie)
    return false;

  /* Firefox on Android push notifications not supported until at least 48: https://bugzilla.mozilla.org/show_bug.cgi?id=1206207#c6 */
  if (Browser.firefox && Number(Browser.version) < 48 && (Browser.mobile || Browser.tablet)) {
    return false;
  }

  if (Browser.firefox && Number(Browser.version) >= 44)
    return true;

  if (Browser.safari && Number(Browser.version) >= 7.1)
    return true;

  // Android Chrome WebView
  if (navigator.appVersion.match(/ wv/))
    return false;

  if (Browser.chrome && Number(Browser.version) >= 42)
    return true;

  if (Browser.yandexbrowser && Number(Browser.version) >= 15.12)
    return true;

  // https://www.chromestatus.com/feature/5416033485586432
  if (Browser.opera && Browser.mobile && Number(Browser.version) >= 37)
    return true;

  return false;
}

export function removeDomElement(selector) {
  var els = document.querySelectorAll(selector);
  if (els.length > 0) {
    for (let i = 0; i < els.length; i++)
      els[i].parentNode.removeChild(els[i]);
  }
}

/**
 * Helper method for public APIs that waits until OneSignal is initialized, rejects if push notifications are
 * not supported, and wraps these tasks in a Promise.
 */
export function awaitOneSignalInitAndSupported() {
  return new Promise((resolve, reject) => {
    if (!isPushNotificationsSupported()) {
      throw new PushNotSupportedError();
    }

    if (!OneSignal.initialized) {
      OneSignal.once(OneSignal.EVENTS.SDK_INITIALIZED, () => resolve);
    } else {
      resolve();
    }
  });
}

/**
 * JSON.stringify() but converts functions to "[Function]" so they aren't lost.
 * Helps when logging method calls.
 */
export function stringify(obj) {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'function') {
      return "[Function]";
    } else {
      return value;
    }
  });
}

export function executeCallback<T>(callback: Action<T>, ...args: any[]) {
  if (callback) {
    return callback.apply(null, args);
  }
}

export function logMethodCall(methodName: string, ...args) {
  return log.trace(`Called %c${methodName}(${args.map(stringify).join(', ')})`, getConsoleStyle('code'), '.');
}

export function isValidEmail(email) {
  return !!email &&
         !!email.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/)
}

export function addDomElement(targetSelectorOrElement, addOrder, elementHtml) {
  if (typeof targetSelectorOrElement === 'string')
    document.querySelector(targetSelectorOrElement).insertAdjacentHTML(addOrder, elementHtml);
  else if (typeof targetSelectorOrElement === 'object')
    targetSelectorOrElement.insertAdjacentHTML(addOrder, elementHtml);
  else
    throw new Error(`${targetSelectorOrElement} must be a CSS selector string or DOM Element object.`);
}

export function clearDomElementChildren(targetSelectorOrElement) {
  if (typeof targetSelectorOrElement === 'string') {
    var element = document.querySelector(targetSelectorOrElement);
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
  else if (typeof targetSelectorOrElement === 'object') {
    while (targetSelectorOrElement.firstChild) {
      targetSelectorOrElement.removeChild(targetSelectorOrElement.firstChild);
    }
  }
  else
    throw new Error(`${targetSelectorOrElement} must be a CSS selector string or DOM Element object.`);
}

export function addCssClass(targetSelectorOrElement, cssClass) {
  if (typeof targetSelectorOrElement === 'string')
    document.querySelector(targetSelectorOrElement).classList.add(cssClass);
  else if (typeof targetSelectorOrElement === 'object')
    targetSelectorOrElement.classList.add(cssClass);
  else
    throw new Error(`${targetSelectorOrElement} must be a CSS selector string or DOM Element object.`);
}

export function removeCssClass(targetSelectorOrElement, cssClass) {
  if (typeof targetSelectorOrElement === 'string')
    document.querySelector(targetSelectorOrElement).classList.remove(cssClass);
  else if (typeof targetSelectorOrElement === 'object')
    targetSelectorOrElement.classList.remove(cssClass);
  else
    throw new Error(`${targetSelectorOrElement} must be a CSS selector string or DOM Element object.`);
}

export function hasCssClass(targetSelectorOrElement, cssClass) {
  if (typeof targetSelectorOrElement === 'string')
    return document.querySelector(targetSelectorOrElement).classList.contains(cssClass);
  else if (typeof targetSelectorOrElement === 'object')
    return targetSelectorOrElement.classList.contains(cssClass);
  else
    throw new Error(`${targetSelectorOrElement} must be a CSS selector string or DOM Element object.`);
}

export function on(targetSelectorOrElement, event, task) {
  if (!event) {
    log.error('Cannot call on() with no event: ', event);
  }
  if (!task) {
    log.error('Cannot call on() with no task: ', task)
  }
  if (typeof targetSelectorOrElement === 'string') {
    let els = document.querySelectorAll(selector);
    if (els.length > 0) {
      for (let i = 0; i < els.length; i++)
        on(els[i], task);
    }
  }
  else if (isArray(targetSelectorOrElement)) {
    for (let i = 0; i < targetSelectorOrElement.length; i++)
      on(targetSelectorOrElement[i], task);
  }
  else if (typeof targetSelectorOrElement === 'object')
    targetSelectorOrElement.addEventListener(event, task);
  else
    throw new Error(`${targetSelectorOrElement} must be a CSS selector string or DOM Element object.`);
}

var DEVICE_TYPES = {
  CHROME: 5,
      SAFARI: 7,
      FIREFOX: 8,
};

export function getDeviceTypeForBrowser() {
  if (Browser.chrome || Browser.yandexbrowser || Browser.opera) {
    return DEVICE_TYPES.CHROME;
  } else if (Browser.firefox) {
    return DEVICE_TYPES.FIREFOX;
  } else if (Browser.safari) {
    return DEVICE_TYPES.SAFARI;
  }
}

export function once(targetSelectorOrElement, event, task, manualDestroy=false) {
  if (!event) {
    log.error('Cannot call on() with no event: ', event);
  }
  if (!task) {
    log.error('Cannot call on() with no task: ', task)
  }
  if (typeof targetSelectorOrElement === 'string') {
    let els = document.querySelectorAll(selector);
    if (els.length > 0) {
      for (let i = 0; i < els.length; i++)
        once(els[i], task);
    }
  }
  else if (isArray(targetSelectorOrElement)) {
    for (let i = 0; i < targetSelectorOrElement.length; i++)
      once(targetSelectorOrElement[i], task);
  }
  else if (typeof targetSelectorOrElement === 'object') {
    var taskWrapper = (function () {
      var internalTaskFunction = function (e) {
        var destroyEventListener = function() {
          targetSelectorOrElement.removeEventListener(e.type, taskWrapper);
        };
        if (!manualDestroy) {
          destroyEventListener();
        }
        task(e, destroyEventListener);
      };
      return internalTaskFunction;
    })();
    targetSelectorOrElement.addEventListener(event, taskWrapper);
  }
  else
    throw new Error(`${targetSelectorOrElement} must be a CSS selector string or DOM Element object.`);
}

/**
 * Removes event handler from selector.
 * @param targetSelectorOrElement Selector to target one or multiple elements, or a single or array of DOMElement.
 * @param event The event to target (e.g. 'transitionend')
 * @param task A single function callback to unbind, or leave empty to remove all event handlers.
 */
export function off(targetSelectorOrElement, event, task) {
  if (typeof targetSelectorOrElement === 'string') {
    let els = document.querySelectorAll(selector);
    if (els.length > 0) {
      for (let i = 0; i < els.length; i++)
        off(els[i], task);
    }
  }
  else if (isArray(targetSelectorOrElement)) {
    for (let i = 0; i < targetSelectorOrElement.length; i++)
      off(targetSelectorOrElement[i], task);
  }
  else if (typeof targetSelectorOrElement === 'object')
    if (task)
      targetSelectorOrElement.removeEventListener(event, task);
    else
      targetSelectorOrElement.removeEventListener(event);
  else
    throw new Error(`${targetSelectorOrElement} must be a CSS selector string or DOM Element object.`);
}

export function getConsoleStyle(style) {
  if (style == 'code') {
    return `
    padding: 0 1px 1px 5px;
    border: 1px solid #ddd;
    border-radius: 3px;
    font-family: Monaco,"DejaVu Sans Mono","Courier New",monospace;
    color: #444;
    `
  } else if (style == 'bold') {
    return `
      font-weight: 600;
    color: rgb(51, 51, 51);
    `;
  } else if (style == 'alert') {
    return `
      font-weight: 600;
    color: red;
    `;
  } else if (style == 'event') {
    return `
    color: green;
    `;
  } else if (style == 'postmessage') {
    return `
    color: orange;
    `;
  } else if (style == 'serviceworkermessage') {
    return `
    color: purple;
    `;
  }
}

/**
 * Returns a promise for the setTimeout() method.
 * @param durationMs
 * @returns {Promise} Returns a promise that resolves when the timeout is complete.
 */
export function delay(durationMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs)
  });
}

export function nothing() {
  return Promise.resolve();
}

export function executeAndTimeoutPromiseAfter(promise, milliseconds, displayError) {
  let timeoutPromise = new Promise(resolve => setTimeout(() => resolve('promise-timed-out'), milliseconds));
  return Promise.race([promise, timeoutPromise]).then(value => {
    if (value === 'promise-timed-out') {
      log.warn(displayError || `Promise ${promise} timed out after ${milliseconds} ms.`);
      return Promise.reject(displayError || `Promise ${promise} timed out after ${milliseconds} ms.`);
    }
    else return value;
  });
}

export function when(condition, promiseIfTrue, promiseIfFalse) {
  if (promiseIfTrue === undefined)
    promiseIfTrue = nothing();
  if (promiseIfFalse === undefined)
    promiseIfFalse = nothing();
  return (condition ? promiseIfTrue : promiseIfFalse);
}

export function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var crypto = window.crypto || window.msCrypto;
    if (crypto) {
      var r = crypto.getRandomValues(new Uint8Array(1))[0] % 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    } else {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });
    }
  });
}

/**
 * Returns true if match is in string; otherwise, returns false.
 */
export function contains(indexOfAble, match) {
  if (!indexOfAble)
    return false;
  return indexOfAble.indexOf(match) !== -1;
}

/**
 * Returns the current object without keys that have undefined values.
 * Regardless of whether the return result is used, the passed-in object is destructively modified.
 * Only affects keys that the object directly contains (i.e. not those inherited via the object's prototype).
 * @param object
 */
export function trimUndefined(object) {
  for (var property in object) {
    if (object.hasOwnProperty(property)) {
      if (object[property] === undefined) {
        delete object[property];
      }
    }
  }
  return object;
}

/**
 * Returns true if the UUID is a string of 36 characters;
 * @param uuid
 * @returns {*|boolean}
 */
export function isValidUuid(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid);
}

/**
 * Returns the correct subdomain if 'https://subdomain.onesignal.com' or something similar is passed.
 */
export function normalizeSubdomain(subdomain) {
  subdomain = subdomain.trim();
  let removeSubstrings = [
    'http://www.',
    'https://www.',
    'http://',
    'https://',
    '.onesignal.com/',
    '.onesignal.com'
  ];
  for (let removeSubstring of removeSubstrings) {
    subdomain = subdomain.replace(removeSubstring, '');
  }
  return subdomain.toLowerCase();
}

export function getUrlQueryParam(name) {
  let url = window.location.href;
  url = url.toLowerCase(); // This is just to avoid case sensitiveness
  name = name.replace(/[\[\]]/g, "\\$&").toLowerCase();// This is just to avoid case sensitiveness for query parameter name
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * Wipe OneSignal-related IndexedDB data on the current origin. OneSignal does not have to be initialized to use this.
 */
export function wipeLocalIndexedDb() {
  log.warn('OneSignal: Wiping local IndexedDB data.');
  return Promise.all([
    IndexedDb.remove('Ids'),
    IndexedDb.remove('NotificationOpened'),
    IndexedDb.remove('Options')
  ]);
}

/**
 * Wipe OneSignal-related IndexedDB data on the "correct" computed origin, but OneSignal must be initialized first to use.
 */
export function wipeIndexedDb() {
  log.warn('OneSignal: Wiping IndexedDB data.');
  return Promise.all([
    Database.remove('Ids'),
    Database.remove('NotificationOpened'),
    Database.remove('Options')
  ]);
}

/**
 * Capitalizes the first letter of the string.
 * @returns {string} The string with the first letter capitalized.
 */
export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Unsubscribe from push notifications without removing the active service worker.
 */
export function unsubscribeFromPush() {
  log.warn('OneSignal: Unsubscribing from push.');
  if (Environment.isServiceWorker()) {
    return registration.pushManager.getSubscription()
                       .then(subscription => {
                         if (subscription) {
                           return subscription.unsubscribe();
                         } else throw new Error('Cannot unsubscribe because not subscribed.');
                       });
  } else {
    if (OneSignal.isUsingSubscriptionWorkaround()) {
      return new Promise((resolve, reject) => {
        log.debug("Unsubscribe from push got called, and we're going to remotely execute it in HTTPS iFrame.");
        OneSignal.iframePostmam.message(OneSignal.POSTMAM_COMMANDS.UNSUBSCRIBE_FROM_PUSH, null, reply => {
          log.debug("Unsubscribe from push succesfully remotely executed.");
          if (reply.data === OneSignal.POSTMAM_COMMANDS.REMOTE_OPERATION_COMPLETE) {
            resolve();
          } else {
            reject('Failed to remotely unsubscribe from push.');
          }
        });
      });
    } else {
      if (!navigator.serviceWorker || !navigator.serviceWorker.controller)
        return Promise.resolve();

      return navigator.serviceWorker.ready
                      .then(registration => registration.pushManager)
                      .then(pushManager => pushManager.getSubscription())
                      .then(subscription => {
                        if (subscription) {
                          return subscription.unsubscribe();
                        }
                      });
    }
  }
}


/**
 * Unregisters the active service worker.
 */
export function wipeServiceWorker() {
  log.warn('OneSignal: Unregistering service worker.');
  if (Environment.isIframe()) {
    return;
  }
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller)
    return Promise.resolve();

  return navigator.serviceWorker.ready
      .then(registration => registration.unregister());
}


/**
 * Unsubscribe from push notifications and remove any active service worker.
 */
export function wipeServiceWorkerAndUnsubscribe() {
  return Promise.all([
    unsubscribeFromPush(),
    wipeServiceWorker()
  ]);
}

export function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * Returns the part of the string after the first occurence of the specified search.
 * @param string The entire string.
 * @param search The text returned will be everything *after* search.
 * e.g. substringAfter('A white fox', 'white') => ' fox'
 */
export function substringAfter(string, search) {
  return string.substr(string.indexOf(search) + search.length);
}

/**
 * Returns the number of times the SDK has been loaded into the browser.
 * Expects a browser environment, otherwise this call will fail.
 */
export function getSdkLoadCount() {
  return window.__oneSignalSdkLoadCount || 0;
}

/**
 * Increments the counter describing the number of times the SDK has been loaded into the browser.
 * Expects a browser environment, otherwise this call will fail.
 */
export function incrementSdkLoadCount() {
  window.__oneSignalSdkLoadCount = getSdkLoadCount() + 1;
}

/**
 * Returns the email with all whitespace removed and converted to lower case.
 */
export function prepareEmailForHashing(email) {
  return email.replace(/\s/g, '').toLowerCase();
}

/**
 * Taken from: https://gist.github.com/MichaelPote/3f0cefaaa9578d7e30be
 * which is from: http://stackoverflow.com/questions/1655769/fastest-md5-implementation-in-javascript#comment55880433_1655795
 */
export function md5(s) {
  var md5cycle = function (x, k) {
    var a = x[0],
      b = x[1],
      c = x[2],
      d = x[3];

    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);

  }

  var cmn = function (q, a, b, x, s, t) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }

  var ff = function (a, b, c, d, x, s, t) {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t);
  }

  var gg = function (a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t);
  }

  var hh = function (a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  var ii = function (a, b, c, d, x, s, t) {
    return cmn(c ^ (b | (~d)), a, b, x, s, t);
  }

  var md51 = function (s) {
    var txt = '',
      n = s.length,
      state = [1732584193, -271733879, -1732584194, 271733878],
      i;
    for (i = 64; i <= s.length; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < s.length; i++)
      tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++) tail[i] = 0;
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }

  /* there needs to be support for Unicode here,
   * unless we pretend that we can redefine the MD-5
   * algorithm for multi-byte characters (perhaps
   * by adding every four 16-bit characters and
   * shortening the sum to 32 bits). Otherwise
   * I suggest performing MD-5 as if every character
   * was two bytes--e.g., 0040 0025 = @%--but then
   * how will an ordinary MD-5 sum be matched?
   * There is no way to standardize text to something
   * like UTF-8 before transformation; speed cost is
   * utterly prohibitive. The JavaScript standard
   * itself needs to look at this: it should start
   * providing access to strings as preformed UTF-8
   * 8-bit unsigned value arrays.
   */
  var md5blk = function (s) { /* I figured global was faster.   */
    var md5blks = [],
      i; /* Andy King said do it this way. */
    for (i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }

  var hex_chr = '0123456789abcdef'.split('');

  var rhex = function (n) {
    var s = '',
      j = 0;
    for (; j < 4; j++)
      s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
    return s;
  }

  var hex = function (x) {
    for (var i = 0; i < x.length; i++)
      x[i] = rhex(x[i]);
    return x.join('');
  }

  var md5 = global.md5 = function (s) {
    return hex(md51(s));
  }

  /* this function is much faster,
   so if possible we use it. Some IEs
   are the only ones I know of that
   need the idiotic second function,
   generated by an if clause.  */

  var add32 = function (a, b) {
    return (a + b) & 0xFFFFFFFF;
  }

  if (md5('hello') != '5d41402abc4b2a76b9719d911017c592') {
    add32 = function (x, y) {
      var lsw = (x & 0xFFFF) + (y & 0xFFFF),
        msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xFFFF);
    }
  }
}

/**
 * Taken from: https://github.com/jbt/js-crypto/blob/master/sha1-min.js
 */
export function sha1(d) {
  var l = 0, a = 0, f = [], b, c, g, h, p, e, m = [b = 1732584193, c = 4023233417, ~b, ~c, 3285377520], n = [], k = unescape(encodeURI(d));
  for (b = k.length; a <= b;)n[a >> 2] |= (k.charCodeAt(a) || 128) << 8 * (3 - a++ % 4);
  for (n[d = b + 8 >> 2 | 15] = b << 3; l <= d; l += 16) {
    b = m;
    for (a = 0; 80 > a; b = [[(e = ((k = b[0]) << 5 | k >>> 27) + b[4] + (f[a] = 16 > a ? ~~n[l + a] : e << 1 | e >>> 31) + 1518500249) + ((c = b[1]) & (g = b[2]) | ~c & (h = b[3])), p = e + (c ^ g ^ h) + 341275144, e + (c & g | c & h | g & h) + 882459459, p + 1535694389][0 | a++ / 20] | 0, k, c << 30 | c >>> 2, g, h])e = f[a - 3] ^ f[a - 8] ^ f[a - 14] ^ f[a - 16];
    for (a = 5; a;)m[--a] = m[a] + b[a] | 0
  }
  for (d = ""; 40 > a;)d += (m[a >> 3] >> 4 * (7 - a++ % 8) & 15).toString(16);
  return d;
}