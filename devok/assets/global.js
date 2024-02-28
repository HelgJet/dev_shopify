function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

function getCookie(name) {
  var value = '; ' + document.cookie;
  var parts = value.split('; ' + name + '=');
  if (parts.length == 2) {
    return parts.pop().split(';').shift(); 
  }
}

function setCookie(name, value, days, path) {
  var expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=' + path; 
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute('role', 'button');
  summary.setAttribute('aria-expanded', summary.parentNode.hasAttribute('open'));

  if(summary.nextElementSibling.getAttribute('id')) {
    summary.setAttribute('aria-controls', summary.nextElementSibling.id);
  }

  summary.addEventListener('click', (event) => {
    event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
  });

  if (summary.closest('header-drawer, menu-drawer')) return;
  summary.parentElement.addEventListener('keyup', onKeyUpEscape); 
});

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (event.target !== container && event.target !== last &&event.target !== first) return;
    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function() {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function(event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if ((event.target === container || event.target === first) && event.shiftKey) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();

  if (elementToFocus.tagName === 'INPUT' && ['search', 'text', 'email', 'url'].includes(elementToFocus.type) && elementToFocus.value) {
    elementToFocus.setSelectionRange(0, elementToFocus.value.length);
  }
}


// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(":focus-visible");
} catch(e) {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = ['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', 'TAB', 'ENTER', 'SPACE', 'ESCAPE', 'HOME', 'END', 'PAGEUP', 'PAGEDOWN']
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener('keydown', (event) => {
    if(navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener('mousedown', (event) => {
    mouseClick = true;
  });

  window.addEventListener('focus', () => {
    if (currentFocusedElement) currentFocusedElement.classList.remove('focused');

    if (mouseClick) return;

    currentFocusedElement = document.activeElement;
    currentFocusedElement.classList.add('focused');

  }, true);
}

function pauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  document.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  document.querySelectorAll('video').forEach((video) => video.pause());
  document.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.setAttribute('aria-expanded', false);
  summaryElement.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });

    this.input.addEventListener('change', this.onInputChange.bind(this));
    this.querySelectorAll('button').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, this.validateQtyRules.bind(this));
  }

  disconnectedCallback() {
    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }

  onInputChange(event) {
    this.validateQtyRules();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const min = parseInt(this.input.min);
      const buttonMinus = this.querySelector(".quantity__button[name='minus']");
      buttonMinus.classList.toggle('disabled', value <= min);
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".quantity__button[name='plus']");
      buttonPlus.classList.toggle('disabled', value >= max);
    } 
  }
}

customElements.define('quantity-input', QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: `application/${type}` },
  };
}

/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == 'undefined') {
  window.Shopify = {};
}

Shopify.bind = function(fn, scope) {
  return function() {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function(selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function(target, eventName, callback) {
  target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on'+eventName, callback);
};

Shopify.postLink = function(path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for(var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function(country_domid, province_domid, options) {
  this.countryEl         = document.getElementById(country_domid);
  this.provinceEl        = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler,this));

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function() {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function() {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function(e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function(selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  }
};


window.theme = window.theme || {};

theme.config = {
  mqlSmall: false,
  mediaQuerySmall: 'screen and (max-width: 749px)',
  mediaQueryLarge: 'screen and (min-width: 990px)'
};


window.theme.Currency = (function() {
  const moneyFormat = '${{amount}}'; 

  function formatMoney(cents, format) {
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    let value = '';
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    const formatString = format || moneyFormat;

    function formatWithDelimiters(number, precision, thousands, decimal) {
      thousands = thousands || ',';
      decimal = decimal || '.';

      if (isNaN(number) || number === null) {
        return 0;
      }

      number = (number / 100.0).toFixed(precision);

      const parts = number.split('.');
      const dollarsAmount = parts[0].replace(
        /(\d)(?=(\d\d\d)+(?!\d))/g,
        '$1' + thousands
      );
      const centsAmount = parts[1] ? decimal + parts[1] : '';

      return dollarsAmount + centsAmount;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
      case 'amount_no_decimals_with_space_separator':
        value = formatWithDelimiters(cents, 0, ' ');
        break;
      case 'amount_with_apostrophe_separator':
        value = formatWithDelimiters(cents, 2, "'");
        break;
    }

    return formatString.replace(placeholderRegex, value);
  }

  return {
    formatMoney: formatMoney
  };
})(); 

window.theme.initWhenVisible = function(options) {
  const { threshold = 0, callback, element } = options;

  const observer = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting && typeof callback === 'function') {
        callback();
        observer.unobserve(entry.target);
      }
    }
  }, { rootMargin: `0px 0px ${threshold}px 0px` });

  observer.observe(element);
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector('details');
    this.addEventListener('keyup', this.onKeyUp.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll('summary').forEach((summary) =>
      summary.addEventListener('click', this.onSummaryClick.bind(this))
    );
    this.querySelectorAll('button:not(.localization-selector)').forEach((button) =>
      button.addEventListener('click', this.onCloseButtonClick.bind(this))
    ); 
  }


  onKeyUp(event) {
    if(event.code.toUpperCase() !== 'ESCAPE') return;

    const openDetailsElement = event.target.closest('details[open]');
    if(!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle ? this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector('summary')) : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const parentMenuElement = detailsElement.closest('.has-submenu');
    const isOpen = detailsElement.hasAttribute('open');
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function addTrapFocus() {
      trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector('button'));
      summaryElement.nextElementSibling.removeEventListener('transitionend', addTrapFocus);
    }

    if (detailsElement === this.mainDetailsToggle) {
      if(isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(event, summaryElement) : this.openMenuDrawer(summaryElement);

      if (window.matchMedia('(max-width: 990px)')) {
        document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
      }
    } else {
      setTimeout(() => {
        detailsElement.classList.add('menu-opening');
        summaryElement.setAttribute('aria-expanded', true);
        parentMenuElement && parentMenuElement.classList.add('submenu-open');
        !reducedMotion || reducedMotion.matches
          ? addTrapFocus()
          : summaryElement.nextElementSibling.addEventListener('transitionend', addTrapFocus);
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });
    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event === undefined) return;

    this.mainDetailsToggle.classList.remove('menu-opening');
    this.mainDetailsToggle.querySelectorAll('details').forEach(details => {
      details.removeAttribute('open');
      details.classList.remove('menu-opening');
    });
    this.mainDetailsToggle.querySelectorAll('.submenu-open').forEach(submenu => {
      submenu.classList.remove('submenu-open');
    });
    document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
    removeTrapFocus(elementToFocus);
    this.closeAnimation(this.mainDetailsToggle);
    if (event instanceof KeyboardEvent) elementToFocus?.setAttribute('aria-expanded', false);

  }

  onFocusOut() {
    setTimeout(() => {
      if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement))
        this.closeMenuDrawer();
    });
  }


  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest('details');
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    const parentMenuElement = detailsElement.closest('.submenu-open');
    parentMenuElement && parentMenuElement.classList.remove('submenu-open');
    detailsElement.classList.remove('menu-opening');
    detailsElement.querySelector('summary').setAttribute('aria-expanded', false);
    removeTrapFocus(detailsElement.querySelector('summary'));
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute('open');
        if (detailsElement.closest('details[open]')) {
          trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
        }
      }
    }

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define('menu-drawer', MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header = this.header || document.querySelector('.section-header');

    this.borderOffset =
      this.borderOffset || this.closest('.header-wrapper').classList.contains('header-wrapper--border-bottom') ? 1 : 0;
    document.documentElement.style.setProperty(
      '--header-bottom-position',
      `${parseInt(this.header.getBoundingClientRect().bottom - this.borderOffset)}px`
    );
    this.header.classList.add('menu-open');

    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });

    summaryElement.setAttribute('aria-expanded', true);
    window.addEventListener('resize', this.onResize);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }


  closeMenuDrawer(event, elementToFocus) {
    if (!elementToFocus) return;
    super.closeMenuDrawer(event, elementToFocus);
    this.header.classList.remove('menu-open');
    window.removeEventListener('resize', this.onResize);
  }

  onResize = () => {
    this.header &&
      document.documentElement.style.setProperty(
        '--header-bottom-position',
        `${parseInt(this.header.getBoundingClientRect().bottom - this.borderOffset)}px`
      );
    document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
  };

}

customElements.define('header-drawer', HeaderDrawer);


class DetailsAccordion extends HTMLElement {
  constructor() {
    super();
    this.details = this.querySelector('details');
    this.summary = this.querySelector('summary');
    this.content = this.querySelector('.accordion__content');

    this.animation = null;
    this.isAnimated = false; 
    this.isExpanded = false;
    this.isClosed = false;  

    window.theme.initWhenVisible({
      threshold: 0.2,
      callback: this.init.bind(this), 
      element: this
    });
  }

  init() {
    this.summary.addEventListener('click', (e) => this.onClick(e));
  }

  onClick(e) {
    e.preventDefault();
    this.details.style.overflow = 'hidden'; 

    if (this.isAnimated){
      return;
    }
    if (this.isClosed || !this.details.open) {
      this.open();
    } else if (this.isExpanded || this.details.open) {
      this.collapse();  
    }
  }

  // Animate height
  animateHeight(startHeight, endHeight, duration, easing, callback) {
    this.isAnimated = true;

    if (this.animation) {
      this.animation.cancel();
    }

    const animation = this.details.animate(
      { height: [startHeight, endHeight] },
      { duration, easing }
    );

    animation.onfinish = () => {
      this.isAnimated = false;
      this.animation = null;
      this.isClosed = false;
      this.isExpanded = false; 

      if (callback) {
        callback();
      }
      this.resetStyles();
    };

    animation.oncancel = () => (this.isAnimated = false);
    this.animation = animation;
  }

  // Collapse the details
  collapse() {
    const summaryStyle = window.getComputedStyle(this.summary);
    const startHeight = `${this.details.offsetHeight}px`;
    const endHeight = `${this.summary.offsetHeight + parseInt(summaryStyle.marginTop)}px`;

    this.animateHeight(startHeight, endHeight, 250, 'ease', () => {
      this.details.open = false;
      this.resetStyles();
    });
  }
  // Open the details with animation
  open() {
    this.details.style.height = `${this.details.offsetHeight}px`;
    this.details.open = true;
    window.requestAnimationFrame(() => this.expand()); 
  }

  // Expand the details
  expand() {
    const summaryStyle = window.getComputedStyle(this.summary);
    const startHeight = `${this.details.offsetHeight}px`;
    const endHeight = `${this.summary.offsetHeight + parseInt(summaryStyle.marginTop) + this.content.offsetHeight}px`;
    this.animateHeight(startHeight, endHeight, 300, 'ease-out'); 
  }

  resetStyles() {
    this.details.style.height = this.details.style.overflow = '';
  }
}

customElements.define('details-accordion', DetailsAccordion);

class ModalDialog extends HTMLElement {
  constructor() {
    super();

    this.querySelector('[id^="ModalClose-"]').addEventListener(
      'click',
      this.hide.bind(this, false)
    );
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });
    if (this.classList.contains('media-modal')) {
      this.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse' && !event.target.closest('deferred-media, product-model')) this.hide();
      }); 
    } else {
      this.addEventListener('click', (event) => {
        if (event.target === this) this.hide();
      });
    }
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    document.body.appendChild(this);
    const outClose = this.querySelector('#compareClearAll');
    if(outClose) {
      outClose.addEventListener('click', () => {
        setTimeout(() => {
         this.hide();  
        }); 
      });
    }
  }

  show(opener) {
    this.openedBy = opener;
    const openerSpinner = opener.querySelector('.loading-overlay__spinner');
    if(openerSpinner) openerSpinner.classList.remove('hidden');
    const popup = this.querySelector('.template-popup');
    document.body.classList.add('overflow-hidden');
    this.setAttribute('open', '');
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    window.pauseAllMedia(); 
    if(openerSpinner){
      setTimeout(() => {
        openerSpinner.classList.add('hidden');
      }, 500);  
    } 
  }

  hide() {
    document.body.classList.remove('overflow-hidden');
    document.body.dispatchEvent(new CustomEvent('modalClosed'));
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define('modal-dialog', ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector('button');   
    if (!button) return;
    button.addEventListener('click', () => {
      const modal = document.querySelector(this.getAttribute('data-modal'));
      if (modal) modal.show(button);  
    });
  }
}
customElements.define('modal-opener', ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener('click', this.loadContent.bind(this)); 
  }

  loadContent(focus = true) {
    window.pauseAllMedia();
    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div');
      content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

      this.setAttribute('loaded', true);
      const deferredElement = this.appendChild(content.querySelector('video, model-viewer, iframe'));
      if (focus) deferredElement.focus();
      if (deferredElement.nodeName == 'VIDEO' && deferredElement.getAttribute('autoplay')) {
        // force autoplay for safari
        deferredElement.play(); 
      }
    }
  }
}

customElements.define('deferred-media', DeferredMedia);


class DeferredSlideMedia extends HTMLElement {
  constructor() {
    super();
    this.deferredEl = null;
    this.buttonPlay = null;
    this.buttonPause = null;
 }

  connectedCallback() {
    this.buttonPlay = this.querySelector('[id^="Deferred-SlideButtonPlay-"]');
    this.buttonPause = this.querySelector('[id^="Deferred-SlideButtonPause-"]');

    if (this.buttonPlay) {
      this.buttonPlay.addEventListener('click', this.handlePlayClick.bind(this));
    }
    if (this.buttonPause) {
      this.buttonPause.addEventListener('click', this.handlePauseClick.bind(this));
    }
  }

  loadContent(focus = true) {
    if (this.hasAttribute('loaded')) return;

    const template = this.querySelector('template');
    if (!template) return;

    const content = document.createElement('div');
    content.appendChild(template.content.firstElementChild.cloneNode(true));

    this.setAttribute('loaded', true);

    const deferredElement = content.querySelector('video'); 
    if (focus) deferredElement.focus(); 

    if (!deferredElement) return;
    
    this.setDuration(deferredElement); 
    this.appendChild(deferredElement);
    this.deferredEl = deferredElement; 
  }

  async setDuration(element) {
    if (element) {
      const duration = await this.getVideoDuration(element);
      if (!isNaN(duration)) {
        this.setAttribute('data-video-duration', duration); 
      }
    }
  }

  async getVideoDuration(elem) {
    if (elem && elem instanceof HTMLVideoElement) {
      return new Promise((resolve) => {
        elem.onloadedmetadata = () => {
          resolve(elem.duration);
        };
      });
    }
  }

  handlePlayClick() {
    const media = this.deferredEl; 
    if(media){
      this.toggleVideoPlayback(media, true); 
    }
  }

  handlePauseClick() {
    const media = this.deferredEl; 
    if(media){ 
      this.toggleVideoPlayback(media, false);  
    }
  }

  toggleVideoPlayback(elem, play) {
    if (elem && elem instanceof HTMLVideoElement) {
      if (play) {
        elem.muted = false;
        const promise = elem.play();
        if (promise !== undefined) {
          promise.then(() => {}).catch((error) => {});
        }
      } else {
        elem.pause();    
      }
    }
    if (this.buttonPlay && this.buttonPause) {
      this.buttonPlay.style.visibility = play ? 'hidden' : 'visible';
      this.buttonPause.style.visibility = play ? 'visible' : 'hidden';
    }
  }
}

customElements.define('deferred-slide-media', DeferredSlideMedia);


class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.enableSliderLooping = false;
    this.currentPageElement = this.querySelector('.slider-counter--current');
    this.pageTotalElement = this.querySelector('.slider-counter--total');
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');
  
    if (!this.slider || !this.nextButton) return;

    this.initPages();
    const resizeObserver = new ResizeObserver(entries => this.initPages()); 
    resizeObserver.observe(this.slider);

    this.slider.addEventListener('scroll', this.update.bind(this));
    this.prevButton.addEventListener('click', this.onButtonClick.bind(this));
    this.nextButton.addEventListener('click', this.onButtonClick.bind(this)); 

    if (this.slider.hasAttribute("data-devok-featcollection-type") && window.innerWidth > 989) {
      this.slider.addEventListener('scroll', this.setSlideVisibility.bind(this));  
    }


    if (this.slider.hasAttribute("data-devok-featcollection-type")) {
      this.autoplayInterval = 5000; // Adjust the autoplay interval in milliseconds
      this.autoplayTimer = null;
  
      // Start autoplay
      this.startAutoplay();
    }

  }

  startAutoplay() {
    this.autoplayTimer = setInterval(() => {
      this.slideNext(); // You can customize this method based on your requirements
    }, this.autoplayInterval);
  }

  stopAutoplay() {
    clearInterval(this.autoplayTimer);
  }

  slideNext() {
    const nextPosition = this.slider.scrollLeft + this.sliderItemOffset;
    this.setSlidePosition(nextPosition);
  }

  setSlideVisibility() {
    if(!this.slider.hasAttribute("data-devok-featcollection-type")) return;
    
    let countVisibleSlides;   
    const isSmallScreen = window.innerWidth <= 989;   
    if(isSmallScreen) {
      countVisibleSlides = this.slider.getAttribute('data-slider-per-mobile');
    } else {
      countVisibleSlides = this.slider.getAttribute('data-slider-per-desktop');  
    } 

    this.sliderControlButtons = this.querySelectorAll('.slider-counter__link');
    if (!this.sliderControlButtons.length) return;
    this.sliderControlButtons.forEach(link => {
        link.classList.remove('slider-counter__link--active');
        link.removeAttribute('aria-current');
    }); 

    this.sliderControlButtons[this.currentPage - parseInt(countVisibleSlides)].classList.add('slider-counter__link--active');
    this.sliderControlButtons[this.currentPage - parseInt(countVisibleSlides)].setAttribute('aria-current', true);
  }   

  initPages() {
    this.sliderItemsToShow = Array.from(this.sliderItems).filter(element => element.clientWidth > 0);
    if (this.sliderItemsToShow.length < 2) return;
    this.sliderItemOffset = this.sliderItemsToShow[1].offsetLeft - this.sliderItemsToShow[0].offsetLeft;
    this.slidesPerPage = Math.floor((this.slider.clientWidth - this.sliderItemsToShow[0].offsetLeft) / this.sliderItemOffset);

    let countVisibleSlides;   
    const isSmallScreen = window.innerWidth <=989;
    if(isSmallScreen) {
      countVisibleSlides = parseInt(this.slider.getAttribute('data-slider-per-mobile'));
    } else {
      countVisibleSlides = parseInt(this.slider.getAttribute('data-slider-per-desktop'));  
    }

    if(this.slider.hasAttribute("data-devok-type")){ 
      this.totalPages = Math.ceil(this.sliderItemsToShow.length - countVisibleSlides + 1);  
    } else if(this.slider.hasAttribute("data-devok-featcollection-type")){
      if(isSmallScreen) {
        if(countVisibleSlides == 1) {
          this.totalPages =  Math.ceil(this.sliderItemsToShow.length - this.slidesPerPage + countVisibleSlides - 1); 
        } else {
          this.totalPages =  Math.ceil(this.sliderItemsToShow.length - this.slidesPerPage + countVisibleSlides);   
        }
      } else {
        this.totalPages =  this.sliderItemsToShow.length - this.slidesPerPage + countVisibleSlides - 1;  
      }
    } else {
      this.totalPages = this.sliderItemsToShow.length - this.slidesPerPage + 1;
    }
    this.update();
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  update() {
    if (!this.slider || !this.nextButton) return;
    const previousPage = this.currentPage;

    if(this.slider.hasAttribute("data-devok-featcollection-type")){
      let countVisibleSlides;   
      const isSmallScreen = window.innerWidth <= 989; 
      if(isSmallScreen) {
        countVisibleSlides = parseInt(this.slider.getAttribute('data-slider-per-mobile'));
      } else {
        countVisibleSlides = parseInt(this.slider.getAttribute('data-slider-per-desktop')); 
      }
      this.currentPage = Math.round(this.slider.scrollLeft / this.sliderItemOffset) + countVisibleSlides;
    } else {
      this.currentPage = Math.round(this.slider.scrollLeft / this.sliderItemOffset) + 1;
    }

    if (this.currentPageElement && this.pageTotalElement) {
      this.currentPageElement.textContent = this.currentPage;
      this.pageTotalElement.textContent = this.totalPages;
    } 

    if (this.currentPage != previousPage) {
      this.dispatchEvent(
        new CustomEvent('slideChanged', {
          detail: {
            currentPage: this.currentPage,
            currentElement: this.sliderItemsToShow[this.currentPage - 1],
          },
        })
      );
    }

    if (this.enableSliderLooping) return;

    if (this.isSlideVisible(this.sliderItemsToShow[0]) && this.slider.scrollLeft === 0 || this.currentPage - 1 == 0 ) {
      this.prevButton.setAttribute('disabled', 'disabled'); 
    } else {
      this.prevButton.removeAttribute('disabled');
    }

    if (this.isSlideVisible(this.sliderItemsToShow[this.sliderItemsToShow.length - 1]) || this.currentPage - 1 === this.totalPages - 1) {
      this.nextButton.setAttribute('disabled', 'disabled');
    } else {
      this.nextButton.removeAttribute('disabled');
    }
  }

  isSlideVisible(element, offset = 0) {
    const lastVisibleSlide = this.slider.clientWidth + this.slider.scrollLeft - offset; 
    return (element.offsetLeft + element.clientWidth) <= lastVisibleSlide && element.offsetLeft >= this.slider.scrollLeft;
  }

  onButtonClick(event) {
    event.preventDefault();
    const step = event.currentTarget.dataset.step || 1;
    this.slideScrollPosition = event.currentTarget.name === 'next' ? this.slider.scrollLeft + (step * this.sliderItemOffset) : this.slider.scrollLeft - (step * this.sliderItemOffset);
    this.setSlidePosition(this.slideScrollPosition);

       // Stop autoplay when user interacts with the slider
      this.stopAutoplay(); 
  }


  setSlidePosition(position) {
    this.slider.scrollTo({
      left: position,
    });
  }


}

customElements.define('slider-component', SliderComponent);

class SlideshowComponent extends SliderComponent {
  constructor() {
    super();
    this.sliderControlWrapper = this.querySelector('.slider-buttons');
    this.enableSliderLooping = true;
    this.dafaultSpeed = this.slider.dataset.speed; 
    if (!this.sliderControlWrapper) return; 

    this.sliderFirstItemNode = this.slider.querySelector('.slideshow__slide');
    this.currentPage = this.sliderItemsToShow.length > 0 ? 1 : 0; 

    this.sliderControlLinksArray = Array.from(this.sliderControlWrapper.querySelectorAll('.slider-counter__link'));
    this.sliderControlLinksArray.forEach(link => link.addEventListener('click', this.linkToSlide.bind(this)));
    this.slider.addEventListener('scroll', this.setSlideVisibility.bind(this));

    this.setSlideVisibility();
    if (this.slider.getAttribute('data-autoplay') === 'true') {
      this.setAutoPlay(); 
      this.slider.addEventListener('scroll', () => {
        this.setDuration();
        this.restartAutoPlay();
      });
    } 
  }

  onButtonClick(event) {
    super.onButtonClick(event);
    const isFirstSlide = this.currentPage === 1;
    const isLastSlide = this.currentPage === this.sliderItemsToShow.length;

    if (!isFirstSlide && !isLastSlide) return;

    if (isFirstSlide && event.currentTarget.name === 'previous') {
      this.slideScrollPosition = this.slider.scrollLeft + this.sliderFirstItemNode.clientWidth * this.sliderItemsToShow.length;
    } else if (isLastSlide && event.currentTarget.name === 'next') {
      this.slideScrollPosition = 0;
    }
    this.slider.scrollTo({ left: this.slideScrollPosition });
  }

  update() {
    super.update();

    const { currentPage } = this;
    this.sliderControlButtons = this.querySelectorAll('.slider-counter__link');
    this.prevButton.removeAttribute('disabled'); 

    if (!this.sliderControlButtons.length) return;

    this.sliderControlButtons.forEach((link, index) => {
      const isActive = index === currentPage - 1;
      link.classList.toggle('slider-counter__link--active', isActive);
      link.setAttribute('aria-current', isActive);
    }); 
  }

  setAutoPlay() {
    this.sliderAutoplayButton = this.querySelector('.slideshow__autoplay'); 
    this.setDuration();
    this.sliderAutoplayButton.addEventListener('click', this.autoPlayToggle.bind(this));
    this.addEventListener('mouseover', this.focusInHandling.bind(this));
    this.addEventListener('mouseleave', this.focusOutHandling.bind(this));
    this.addEventListener('focusin', this.focusInHandling.bind(this));
    this.addEventListener('focusout', this.focusOutHandling.bind(this)); 
    this.playSlide(); 
    this.autoplayButtonIsSetToPlay = true;  
  }

  autoPlayToggle() {
    this.togglePlayButtonState(this.autoplayButtonIsSetToPlay);
    this.autoplayButtonIsSetToPlay ? this.pauseSlide() : this.playSlide();
    this.autoplayButtonIsSetToPlay = !this.autoplayButtonIsSetToPlay;
  }

  focusOutHandling(event) {
    const focusedOnAutoplayButton = event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
    if (!this.autoplayButtonIsSetToPlay || focusedOnAutoplayButton) return;
    this.playSlide();
  }

  focusInHandling(event) {
    const focusedOnAutoplayButton = event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
    if (focusedOnAutoplayButton && this.autoplayButtonIsSetToPlay) {
      this.playSlide();
    } else if (this.autoplayButtonIsSetToPlay) {
      this.pauseSlide();
    }
  }

  playSlide() {
    this.slider.setAttribute('aria-live', 'off');
    clearInterval(this.autoplay);  
    this.autoplay = setInterval(this.autoRotateSlides.bind(this), this.autoplaySpeed); 
  }

  pauseSlide() {
    this.slider.setAttribute('aria-live', 'polite');
    clearInterval(this.autoplay);
  }

  togglePlayButtonState(pauseAutoplay) {
    if (pauseAutoplay) {
      this.sliderAutoplayButton.classList.add('slideshow__autoplay--paused');
      this.sliderAutoplayButton.setAttribute('aria-label', window.accessibilityStrings.playshow);
    } else {
      this.sliderAutoplayButton.classList.remove('slideshow__autoplay--paused');
      this.sliderAutoplayButton.setAttribute('aria-label', window.accessibilityStrings.pauseshow);
    }
  }

  autoRotateSlides() {
    const slideScrollPosition = this.currentPage === this.sliderItems.length ? 0 : this.slider.scrollLeft + this.slider.querySelector('.slideshow__slide').clientWidth;
    this.slider.scrollTo({
      left: slideScrollPosition
    });
  }

  restartAutoPlay() {
    if (this.autoplayButtonIsSetToPlay) {
      this.pauseSlide();
      this.playSlide(); 
    }
  }

  setDuration() {
    const currentSlide = this.sliderItemsToShow[this.currentPage - 1]; 
    const videoEl = currentSlide.querySelector('.deferred-media');
    if (videoEl) {  
      const videoDuration = videoEl.getAttribute('data-video-duration'); 
      this.autoplaySpeed = videoDuration * 1000; 
    } else {
      this.autoplaySpeed = this.dafaultSpeed * 1000; 
    }
  }

  setSlideVisibility() {
    for (const [index, item] of this.sliderItemsToShow.entries()) {
      const linkElements = item.querySelectorAll('a');
      const slideVideoItem = item.classList.contains('slideshow__slide__video');
      const isActiveSlide = index === this.currentPage - 1;

      for (const button of linkElements) {
        button.setAttribute('tabindex', isActiveSlide ? '0' : '-1'); 
      }
  
      item.setAttribute('aria-hidden', !isActiveSlide);
      item.setAttribute('tabindex', isActiveSlide ? '0' : '-1');
   
      if (slideVideoItem) {
        this.loadActiveMedia(item); 
        this.slider.classList.add('now--is-video');  
      } else if (slideVideoItem) {
        this.toggleMedia(item, false); 
        this.slider.classList.remove('now--is-video'); 
      }
    }
  }
  
  getDeferredMedia(activeItem) {
    return activeItem.querySelector('.deferred-media');
  }

  toggleMedia(activeItem, play) {
    const deferredMedia = this.getDeferredMedia(activeItem); 
    if (!deferredMedia) return;
 
    if (play) {
      setTimeout(() => {
        deferredMedia.handlePlayClick(); 
      }, 500);
    } else {
     deferredMedia.handlePauseClick(); 
    }
  } 
  
  loadActiveMedia(activeItem) {
    const deferredMedia = this.getDeferredMedia(activeItem);
    if (!deferredMedia) return;
    deferredMedia.loadContent(false);  
  } 

  linkToSlide(event) {
    event.preventDefault();
    const linkIndex = this.sliderControlLinksArray.indexOf(event.currentTarget);
    const slideScrollPosition = this.slider.scrollLeft + this.sliderFirstItemNode.clientWidth * (linkIndex + 1 - this.currentPage);
    this.slider.scrollTo({ left: slideScrollPosition }); 
  }
}

customElements.define('slideshow-component', SlideshowComponent); 


class SliderComponentTab extends HTMLElement {
  constructor() {
    super();
    this.tabSlider = this.querySelector('[id^="SliderTab-"]');
    this.tabContent = this.tabSlider.querySelectorAll(".tab-content"); 
    this.tabNavEls = this.tabSlider.querySelectorAll(".tab-nav"); 

    // Use Intersection Observer to initialize when the element is visible
    window.theme.initWhenVisible({
      threshold: 0.6,
      callback: this.init.bind(this), 
      element: this
     });
  }

  init() {
    if (!this.tabSlider || !this.tabNavEls) return;

    this.tabNavEls.forEach((el, index) => {
      el.addEventListener('click', () => this.onTabClick(index));
    });
  }

  onTabClick(index) {
    if (index >= 0 && index < this.tabContent.length) {
      this.showTabsContent(index);
    }
  }

  hideTabsContent(startIndex) {
    for (let i = startIndex; i < this.tabContent.length; i++) {
      this.tabContent[i].classList.remove('show');
      this.tabContent[i].classList.add('hide');
      this.tabNavEls[i].classList.remove('active');
    }
  }

  showTabsContent(index) {
    if (index >= 0 && index < this.tabContent.length) {
      this.hideTabsContent(0);
      this.tabNavEls[index].classList.add('active');
      this.tabContent[index].classList.remove('hide');
      this.tabContent[index].classList.add('show');

      const slider = this.tabContent[index].querySelector('[id^="Slider-"]');
      const sliderComponent = this.tabContent[index].querySelector('slider-component');
      if (slider && sliderComponent) {
        sliderComponent.resetPages();
      }
    }
  }
}

customElements.define('slider-component-tab', SliderComponentTab);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange);
    this.addEventListener('click', this.onOptionClick);
  }

  onOptionClick() {
      this.setLegendStatuses();  
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, '', false);
    this.updatePickupAvailability();
    this.removeErrorMessage();
    this.updateVariantStatuses();
    this.setLegendStatuses();

    if (!this.currentVariant) {
      this.toggleAddButton(true, '', true);
      this.setUnavailable();
    } else {
      if (filterMedia === true){
        this.filterMedia();
      }
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput(); 
      this.renderProductInfo();
      this.updateShareUrl(); 
      this.updateStockBar();
      this.updateVariantTitle();
    }
    if (this.currentVariant) {
      // When variant is changed post a message with the variant's data
      window.postMessage({
        type: 'variant_changed',
        variant: this.currentVariant
      }, '*')
    }
  }

  filterMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media || this.currentVariant.featured_media.alt === undefined) return; 
    const thumbsFilterList = Array.from(document.querySelectorAll('[data-thumbnail-filter]'));
    const selected_variant = this.currentVariant.featured_media.alt; 
     thumbsFilterList.forEach((thumbFilterItem) => {
      thumbFilterItem.classList.add('hidden');
      const thumbFilterVariant = thumbFilterItem.getAttribute('data-thumbnail-filter');
       if(selected_variant == thumbFilterVariant) thumbFilterItem.classList.remove('hidden');
     });
  }

  updateOptions() {
    this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    const mediaGalleries = document.querySelectorAll(`[id^="MediaGallery-${this.dataset.section}"]`);
    mediaGalleries.forEach(mediaGallery => mediaGallery.setActiveMedia(`${this.dataset.section}-${this.currentVariant.featured_media.id}`, true));
    if (filterMedia === true){
      this.filterMedia(); 
    }
    const modalContent = document.querySelector(`#ProductModal-${this.dataset.section} .product-media-modal__content`);
    if (!modalContent) return;
    const newMediaModal = modalContent.querySelector( `[data-media-id="${this.currentVariant.featured_media.id}"]`);
    modalContent.prepend(newMediaModal);
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantTitle() {
    if (!this.currentVariant) return;
    if (this.currentVariant.title === "Default Title") return; 
    const variantTitle =  document.getElementById(`CurrentVariantTitle-${this.dataset.section}`);
    if(variantTitle) variantTitle.innerHTML = this.currentVariant.title; 
  }

  updateShareUrl() {
    const shareButton = document.getElementById(`Share-${this.dataset.section}`);
    if (!shareButton || !shareButton.updateUrl) return;
    shareButton.updateUrl(`${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }  

  updateVariantStatuses() {
    const selectedOptionOneVariants = this.variantData.filter(
      (variant) => this.querySelector(':checked').value === variant.option1
    );
    const inputWrappers = [...this.querySelectorAll('.product-form__input')];
    inputWrappers.forEach((option, index) => {
      if (index === 0) return;
      const optionInputs = [...option.querySelectorAll('input[type="radio"], option')];
      const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
      const availableOptionInputsValue = selectedOptionOneVariants
        .filter((variant) => variant.available && variant[`option${index}`] === previousOptionSelected)
        .map((variantOption) => variantOption[`option${index + 1}`]);
      this.setInputAvailability(optionInputs, availableOptionInputsValue);
    });
  }

  setLegendStatuses() {
    const inputLegendWrappers = [...this.querySelectorAll('.product-form__input')];
    inputLegendWrappers.forEach((option) => {
      const optionLegendInputs = [...option.querySelectorAll('input[type="radio"], select')];
      const legendContainer = option.querySelector('[data-label-legend]');
      this.setLegendOptionSelected(optionLegendInputs, legendContainer)
    });
  }

  setLegendOptionSelected(listLegendOfOptions, legendOfOption) {
    listLegendOfOptions.forEach(input => input.addEventListener('change', () =>
    legendOfOption.innerText = input.value))
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach(input => {
      if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
        input.innerText = input.getAttribute('value');
      } else {
        input.innerText = window.variantStrings.unavailable_with_option.replace('[value]', input.getAttribute('value'));
      }
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector('pickup-availability');
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute('available');
      pickUpAvailability.innerHTML = '';
    }
  }

  removeErrorMessage() {
    const section = this.closest('section');
    if (!section) return;

    const productForm = section.querySelector('product-form');
    if (productForm) productForm.handleErrorMessage();
  }


  renderProductInfo() {
    const requestedVariantId = this.currentVariant.id;
    const sectionId = this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section;

    fetch(`${this.dataset.url}?variant=${requestedVariantId}&section_id=${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`)
      .then((response) => response.text())
      .then((responseText) => {
        // prevent unnecessary ui changes from abandoned selections
        if (this.currentVariant.id !== requestedVariantId) return;
        const html = new DOMParser().parseFromString(responseText, 'text/html')
        const destination = document.getElementById(`price-${this.dataset.section}`);
        const source = html.getElementById(`price-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const skuSource = html.getElementById(`Sku-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const skuDestination = document.getElementById(`Sku-${this.dataset.section}`);
        const inventorySource = html.getElementById(`Inventory-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const inventoryDestination = document.getElementById(`Inventory-${this.dataset.section}`);
        const notifySource = html.getElementById(`Notify-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const notifyDestination = document.getElementById(`Notify-${this.dataset.section}`); 
        const weigthSource = html.getElementById(`Weight-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const weigthDestination = document.getElementById(`Weight-${this.dataset.section}`);

        const volumePricingSource = html.getElementById(
          `Volume-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`
        );

        const pricePerItemDestination = document.getElementById(`Price-Per-Item-${this.dataset.section}`);
        const pricePerItemSource = html.getElementById(`Price-Per-Item-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);

        const volumePricingDestination = document.getElementById(`Volume-${this.dataset.section}`);
        const qtyRules = document.getElementById(`Quantity-Rules-${this.dataset.section}`);
        const volumeNote = document.getElementById(`Volume-Note-${this.dataset.section}`);

        if (volumeNote) volumeNote.classList.remove('hidden');
        if (volumePricingDestination) volumePricingDestination.classList.remove('hidden');
        if (qtyRules) qtyRules.classList.remove('hidden');

        if (source && destination) destination.innerHTML = source.innerHTML;
        if (inventorySource && inventoryDestination) inventoryDestination.innerHTML = inventorySource.innerHTML;
        if (notifySource && notifyDestination) notifyDestination.innerHTML = notifySource.innerHTML;
        if (skuSource && skuDestination) {
          skuDestination.innerHTML = skuSource.innerHTML;
          skuDestination.classList.toggle('visually-hidden', skuSource.classList.contains('visually-hidden'));
        }

        if (weigthSource && weigthDestination) {
          weigthDestination.innerHTML = weigthSource.innerHTML;
          weigthDestination.classList.toggle('visually-hidden', weigthSource.classList.contains('visually-hidden'));
        }

        const price = document.getElementById(`price-${this.dataset.section}`); 

        if (price) price.classList.remove('visibility-hidden');

        if (inventoryDestination) inventoryDestination.classList.toggle('visibility-hidden', inventorySource.innerText === '');
        if (notifyDestination) notifyDestination.classList.toggle('visually-hidden', notifySource.classList.contains('visually-hidden')); 
        

        if (volumePricingSource && volumePricingDestination) {
          volumePricingDestination.innerHTML = volumePricingSource.innerHTML;
        }

        if (pricePerItemSource && pricePerItemDestination) {
          pricePerItemDestination.innerHTML = pricePerItemSource.innerHTML;
          pricePerItemDestination.classList.toggle('hidden', pricePerItemSource.classList.contains('hidden'));
        }

        const addButtonUpdated = html.getElementById(`ProductSubmitButton-${sectionId}`); 
        this.toggleAddButton(
          addButtonUpdated ? addButtonUpdated.hasAttribute('disabled') : true,
          window.variantStrings.soldOut
        );

        publish(PUB_SUB_EVENTS.variantChange, {
          data: {
            sectionId,
            html,
            variant: this.currentVariant,
          },
        });
      });   
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(`product-form-${this.dataset.section}`);
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');
    if (!addButton) return; 

    if (disable) {
      addButton.setAttribute('disabled', 'disabled');
      if (text) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute('disabled');
      addButtonText.textContent = window.variantStrings.addToCart;
    }

    if (!modifyClass) return; 
  }

  updateStockBar() {
    if (!this.currentVariant) return;
  
    const productMain = this.closest('.product'); 
    const devokStockBar = productMain?.querySelector('.devok-stockbar'); 

    if (devokStockBar) {
      const variantsData = JSON.parse(productMain.querySelector('#product-variants').innerHTML);
      const stockCountdownConfig = JSON.parse(productMain.querySelector('#product-stock-count-config').innerHTML);
      const variant = this.currentVariant;

      const countdownWrapper = devokStockBar; 
      const stockProgressBar = countdownWrapper.querySelector('.devok-stockinfo-probar');
  
      if (variantsData[variant.id] > 0 && variant.inventory_management === 'shopify') {
        devokStockBar.classList.remove('hidden');
        countdownWrapper.classList.replace('devok-stockinfo_low', 'devok-stockinfo_high');
        stockProgressBar.style.width = `${(variantsData[variant.id] * 100) / stockCountdownConfig.max_count}%`;
        
      if (variantsData[variant.id] <= stockCountdownConfig.limited_stock_cut_off) {
        countdownWrapper.classList.replace('devok-stockinfo_high', 'devok-stockinfo_low');        }
      } else {
        devokStockBar.classList.add('hidden');
      }
    }
  }

  setUnavailable() {
    const button = document.getElementById(`product-form-${this.dataset.section}`);
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    const inventory = document.getElementById(`Inventory-${this.dataset.section}`);
    const sku = document.getElementById(`Sku-${this.dataset.section}`);
    const weight = document.getElementById(`Weight-${this.dataset.section}`);
    const notify = document.getElementById(`Notify-${this.dataset.section}`);
    const pricePerItem = document.getElementById(`Price-Per-Item-${this.dataset.section}`);
    const volumeNote = document.getElementById(`Volume-Note-${this.dataset.section}`);
    const volumeTable = document.getElementById(`Volume-${this.dataset.section}`);
    const qtyRules = document.getElementById(`Quantity-Rules-${this.dataset.section}`);
    
    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add('visibility-hidden');
    if (inventory) inventory.classList.add('visibility-hidden');
    if (sku) sku.classList.add('visually-hidden'); 
    if (weight) weight.classList.add('visually-hidden');
    if (notify) notify.classList.remove('visually-hidden');
    if (pricePerItem) pricePerItem.classList.add('hidden');
    if (volumeNote) volumeNote.classList.add('hidden');
    if (volumeTable) volumeTable.classList.add('hidden');
    if (qtyRules) qtyRules.classList.add('hidden'); 
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  } 
}

customElements.define('variant-selects', VariantSelects); 


class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach(input => {
      if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
        input.classList.remove('disabled');
      } else {
        input.classList.add('disabled');
      }
    });
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll('fieldset'));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
    });
  }
}

customElements.define('variant-radios', VariantRadios);


class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);

      fetch(this.dataset.url)
        .then(response => response.text())
        .then(text => {
          const html = document.createElement('div');
          html.innerHTML = text;
          const recommendations = html.querySelector('product-recommendations');

          if (recommendations && recommendations.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
          }

          if (!this.querySelector('slideshow-component') && this.classList.contains('complementary-products')) {
            this.remove();
          }

          if (html.querySelector('.grid__item')) {
            this.classList.add('product-recommendations--loaded'); 
          }
         
        })
        .catch(e => {
          console.error(e);
        });
    }
    const sliderComponent = this.querySelector('slider-component');
      
    if (sliderComponent) {
      sliderComponent.initPages(); 
      sliderComponent.resetPages(); 
    }

    new IntersectionObserver(handleIntersection.bind(this), {rootMargin: '0px 0px 400px 0px'}).observe(this);
  }
}

customElements.define('product-recommendations', ProductRecommendations);

class CountdownTimer extends HTMLElement {
  constructor() {
    super();

    const dataCountDown = this.getAttribute('data-datetime');
    this.countDown = new Date(dataCountDown);

    const { days, hours, minutes, seconds } = this.getDOMElements();

    this.interval = setInterval(() => {
      const now = new Date();
      const distance = Date.parse(this.countDown) - Date.parse(now);

      days.innerText = this.setDataTime(Math.floor(distance / (1000 * 60 * 60 * 24)));
      hours.innerText = this.setDataTime(Math.floor((distance / (1000 * 60 * 60)) % 24));
      minutes.innerText = this.setDataTime(Math.floor((distance / 1000 / 60) % 60));
      seconds.innerText = this.setDataTime(Math.floor((distance / 1000) % 60));

      if (distance <= 0) {
        clearInterval(this.interval);
        this.classList.add('hidden'); 
      }
    }, 1000);
  }

  getDOMElements() {
    return {
      days: this.querySelector('[data-days]'),
      hours: this.querySelector('[data-hours]'),
      minutes: this.querySelector('[data-minutes]'),
      seconds: this.querySelector('[data-seconds]'),
    };
  }

  setDataTime(itemTime) {
    return itemTime < 10 ? `0${itemTime}` : itemTime; 
  }
}

customElements.define('countdown-timer', CountdownTimer); 


const activeWishlist = () => {
  if (productWishlist === false) {
    return;
  }else {
      initBtnWishlist();
  }
}

const activeCompare = () => {
  if (productCompare === false) {
    return;
  }else {
      initBtnCompare();  
  }
}

class ColorOptionSwatch extends HTMLElement {
  constructor() {
    super();
    this.cached = {};
    this.variantId = this.dataset.variantId;
    this.container = this.closest('.card-wrapper');

    if (this.variantId || theme.config.mqlSmall) {
      this.addEventListener('mouseenter', this.onHoverHandler.bind(this));
      if (window.matchMedia(theme.config.mediaQueryLarge).matches) {
        this.querySelector('a').addEventListener('click', (event) => event.preventDefault());
      }
    } else {
      this.addEventListener('mouseenter', this.onHoverHandler.bind(this));
    }
  }

  onHoverHandler() {
    if (this.variantId) {
      theme.config.mqlSmall ? this.colorSwatchChange() : this.colorSwatchFetch();
    } else {
      this.colorSwatchChange(); 
    }
  }

  colorSwatchChange(forceUpdate) {
    const image = this.container.querySelector('.card--image.media img');

    if (image !== null || forceUpdate) {
      if (image !== null) {
        image.src = this.dataset.src;
        image.srcset = this.dataset.srcset;
      }

      const swatches = this.container.querySelectorAll('.color-option-swatch');
      
      swatches.forEach((swatch) => {
        swatch.classList.remove('is-active'); 
      });

      this.classList.add('is-active');

      // Revert div to a href for wrapper
      this.toggleImageDisplay(true);
    }
  }

  toggleImageDisplay(isImageVisible) {
    const imageContainer = this.container.querySelector('.card--image.media');
    if(imageContainer) imageContainer.style.display = isImageVisible ? "block" : "none"; 
  }

  colorSwatchFetch() {
    const productHandle = this.dataset.productHandle;
    const collectionHandle = this.dataset.collectionHandle;
    let sectionUrl = `${window.routes.root_url}/products/${productHandle}?variant=${this.variantId}&view=card`;
    if (collectionHandle.length > 0) {
      sectionUrl = `${window.routes.root_url}/collections/${collectionHandle}/products/${productHandle}?variant=${this.variantId}&view=card`;
    }

    sectionUrl = sectionUrl.replace('//', '/');

    if (this.cached[sectionUrl]) {
      this.renderProductInfo(this.cached[sectionUrl]);
    } else {
      this.fetchAndRenderProductInfo(sectionUrl);
    }
  }

  fetchAndRenderProductInfo(sectionUrl) {
    fetch(sectionUrl)
      .then(response => response.text())
      .then(responseText => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        this.cached[sectionUrl] = html;
        this.renderProductInfo(html);
      })
      .catch(e => {
        console.error(e);
      });
  }

  renderProductInfo(html) {
    this.updateTitle(html);
    this.colorSwatchChange(true);
  }

  updateTitle(html) {
    const selector = '.card__variant__title';
    const destination = this.container.querySelector(selector);
    const source = html.querySelector(selector); 

    if (source && destination) {
      destination.innerHTML = source.innerHTML + '<span class="current_variant__title">' + this.getAttribute('title') + '</span>';
    }
  }
}

customElements.define('color-option-swatch', ColorOptionSwatch); 

