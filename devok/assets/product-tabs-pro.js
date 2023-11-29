
 const keyCodes = {
    TAB: 'tab',
    ENTER: 'enter',
    ESC: 'escape',
    SPACE: ' ',
    END: 'end',
    HOME: 'home',
    LEFT: 'arrowleft',
    UP: 'arrowup',
    RIGHT: 'arrowright',
    DOWN: 'arrowdown',
  };

  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      // eslint-disable-next-line babel/no-invalid-this
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

function promiseTransitionEnd(element) {
  const events = [
    'webkitTransitionEnd',
    'otransitionend',
    'oTransitionEnd',
    'msTransitionEnd',
    'transitionend',
  ];

  const properties = [
    'WebkitTransition',
    'MozTransition',
    'OTransition',
    'msTransition',
    'transition',
  ];

  let duration = 0;
  let promise = Promise.resolve();

  properties.forEach(() => {
    /* eslint-disable-next-line */
    duration ||
      (duration = parseFloat(
        window.getComputedStyle(element).transitionDuration
      ));
  });

  if (duration > 0) {
    promise = new Promise((resolve) => {
      const handlers = events.map((event) => {
        element.addEventListener(event, handler);
        return {
          event,
          handler,
        };
      });

      function handler(event) {
        if (event.target !== element) return;

        // eslint-disable-next-line no-shadow
        handlers.forEach(({ event, handler }) => {
          element.removeEventListener(event, handler);
        });

        resolve();
      }
    });
  }

  return promise;
}


function isIntersectionObserverAvailable() {
  if (
    'IntersectionObserver' in window &&
    'IntersectionObserverEntry' in window &&
    'intersectionRatio' in window.IntersectionObserverEntry.prototype
  ) {
    return true;
  }
  return false;
}


const selectorsScroller = {
  arrow: '[data-scroller-arrow]',
  menu: '[data-scroller-content]',
  wrapper: '[data-scroller-wrapper]',
};

const selectorsScrollerContent = {
  noTransition: 'scroller-content--no-transition',
  wrapper: 'scroller-wrapper',
};

const config = {
  offset: 150,
};

class Scroller {
  constructor(container) {
    this.container = container;
  }

  init() {
    this.wrapper = this.container.querySelector(selectorsScroller.wrapper);
    if (!this.wrapper) return;

    this.initialized = true;
    this.menu = this.wrapper.querySelector(selectorsScroller.menu);
    this.arrows = this.container.querySelectorAll(selectorsScroller.arrow);
    this.isTransitioning = false;

    this._setupEventHandlers();
    this._recalculateOverflow();

  }

  makeElementVisible(element) {
    if (this.overflowValue === 'none' || !this.initialized) return;

    let elementVisible = true;
    const offset = config.offset / 2;
    const elementRect = element.getBoundingClientRect();
    const elementLeft = Math.floor(elementRect.left) - offset;
    const elementRight = Math.floor(elementRect.right) + offset;

    if (!this.wrapperRect) this._recalculateOverflow();

    if (elementRight > this.wrapperRect.right) {
      this.direction = 'next';
      elementVisible = false;
    } else if (elementLeft < this.wrapperRect.left) {
      this.direction = 'previous';
      elementVisible = false;
    }

    if (elementVisible || this.isTransitioning) return;

    this.isTransitioning = true;
    const distance = this._getDistanceToElement(
      elementRight,
      element.offsetLeft,
      offset
    );
    this._setMenuTranslateX(distance);
  }

  destroy() {
    if (!this.initialized) return;
    this.wrapper.removeEventListener(
      'scroll',
      this.eventHandlers.recalculateOverflow,
      { passive: true }
    );

    window.removeEventListener('resize', this.eventHandlers.debounceScroller);

    this.arrows.forEach((arrow) => {
      arrow.removeEventListener('click', this.eventHandlers.onArrowClick);
    });
  }

  _recalculateOverflow() {
    const overflowValue = this._getOverflowValue();
    this._setOverflowClass(overflowValue);
  }

  _setupEventHandlers() {
    this.eventHandlers = this._getEventHandlers();
    this.wrapper.addEventListener(
      'scroll',
      this.eventHandlers.recalculateOverflow,
      { passive: true }
    );

    window.addEventListener('resize', this.eventHandlers.debounceScroller);

    this.arrows.forEach((arrow) => {
      arrow.addEventListener('click', this.eventHandlers.onArrowClick);
    });
  }

  _getEventHandlers() {
    return {
      recalculateOverflow: this._recalculateOverflow.bind(this),
      onArrowClick: this._onArrowClick.bind(this),
      debounceScroller: debounce(() => {
        this._recalculateOverflow();
      }, 250),
    };
  }

  _getOverflowValue() {
    this._getSelectorsDomRect();
    const wrapperLeft = Math.floor(this.wrapperRect.left);
    const wrapperRight = Math.floor(this.wrapperRect.right);
    const menuLeft = Math.floor(this.menuRect.left);
    const menuRight = Math.floor(this.menuRect.right);

    const leftOverflow = menuLeft < wrapperLeft;
    const rightOverflow = menuRight > wrapperRight;

    let overflowValue = 'none';
    if (leftOverflow && rightOverflow) {
      overflowValue = 'both';
    } else if (leftOverflow) {
      overflowValue = 'left';
    } else if (rightOverflow) {
      overflowValue = 'right';
    }

    return overflowValue;
  }

  _getSelectorsDomRect() {
    this.wrapperRect = this.wrapper.getBoundingClientRect();
    this.menuRect = this.menu.getBoundingClientRect();
  }

  _setOverflowClass(overflowValue) {
    if (this.overflowValue === overflowValue) return;

    this.wrapper.classList.remove(`${selectorsScrollerContent.wrapper}--${this.overflowValue}`);

    window.requestAnimationFrame(() => {
      this.wrapper.classList.add(`${selectorsScrollerContent.wrapper}--${overflowValue}`);
      this.overflowValue = overflowValue;
    });
  }

  _onArrowClick(event) {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    this.direction = event.currentTarget.dataset.scrollerArrowDirection;

    const offset = config.offset;
    let distance = this._getDistanceToNextPosition();
    distance = distance < offset * 2 ? distance : offset;
    this._setMenuTranslateX(distance);
  }

  _getDistanceToNextPosition() {
    if (this.direction === 'next') {
      return Math.round(this.menuRect.right - this.wrapperRect.right);
    }

    return this.wrapper.scrollLeft;
  }

  _getDistanceToElement(elementRight, elementLeft, offset) {
    if (this.direction === 'next') {
      const maxDistance = Math.ceil(
        this.menuRect.width - this.wrapperRect.width - this.wrapper.scrollLeft
      );

      let distance = Math.round(elementRight - this.wrapperRect.right) + offset;
      distance = distance < maxDistance ? distance : maxDistance;
      return distance;
    }

    let distance = this.wrapper.scrollLeft - elementLeft + offset;
    distance =
      distance < this.wrapper.scrollLeft ? distance : this.wrapper.scrollLeft;
    return distance;
  }

  _setMenuTranslateX(distance) {
    const translateValue = this.direction === 'next' ? -distance : distance;

    this.menu.style.transform = `translateX(${translateValue}px)`;
    this.translatedValue = translateValue;
    this.menu.classList.remove(selectorsScrollerContent.noTransition);

    promiseTransitionEnd(this.menu).then(() => {
      this._setWrapperScrollLeft();
      this.isTransitioning = false;
    });
  }

  _setWrapperScrollLeft() {
    const translatedValue = Math.abs(this.translatedValue);

    this.menu.style.transform = 'none';
    this.menu.classList.add(selectorsScrollerContent.noTransition);

    if (this.direction === 'previous') {
      this.wrapper.scrollLeft -= translatedValue;
    } else {
      this.wrapper.scrollLeft += translatedValue;
    }
  }
}

const selectorsSticky = {
  stickyElement: '[data-sticky-element]',
  stickySentinelTop: '[data-sticky-sentinel-top]',
  stickySentinelBottom: '[data-sticky-sentinel-bottom]',
};


const selectorsStickyContent = {
  stickyContainer: 'sticky__container',
  stickySentinel: 'sticky__sentinel',
  stickySentinelTop: 'sticky__sentinel--top',
  stickySentinelBottom: 'sticky__sentinel--bottom',
  stickyElement: 'sticky__element', 
};

class StickyElement {
  constructor(container) {
    this.container = container;
  }

  init() {
    if (!isIntersectionObserverAvailable()) return;

    this.stickyElement = this.container.querySelector(selectorsSticky.stickyElement);
    if (!this.stickyElement) return;
    this.sticky = true;
    this._addSentinels();
    this._observeTopSentinel();
    this._observeBottomSentinel();
  }
  
  destroy() {
    if (this.topObserver) this.topObserver.disconnect();
    if (this.bottomObserver) this.bottomObserver.disconnect();
  }

  isSticky() {
    return this.sticky;
  }

  _fireEvent() {
    document.dispatchEvent(
      new window.CustomEvent('elementSticky', {
        detail: {
          stickyElement: this.stickyElement,
          isSticky: this.sticky,
          container: this.container,
        },
      })
    );
  }

  _addSentinels() {
    const sentinelTop = document.createElement('div');
    sentinelTop.classList.add(
      selectorsStickyContent.stickySentinel,
      selectorsStickyContent.stickySentinelTop
    );
    sentinelTop.dataset.stickySentinelTop = '';

    this.container.classList.add(selectorsStickyContent.stickyContainer);

    this.stickyElement.insertAdjacentElement('beforebegin', sentinelTop);

    const sentinelBottom = document.createElement('div');
    sentinelBottom.classList.add(
      selectorsStickyContent.stickySentinel,
      selectorsStickyContent.stickySentinelBottom
    );
    sentinelBottom.dataset.stickySentinelBottom = '';

    this.stickyElement.parentElement.appendChild(sentinelBottom);
  }

  _observeTopSentinel() {
    const topSentinel = this.container.querySelector(
      selectorsSticky.stickySentinelTop
    );
    if (!topSentinel) return;

    this.topObserver = new IntersectionObserver((records) => {
      records.forEach((record) => {
        const targetInfo = record.boundingClientRect; 
        let rootBoundsInfo;

        if(record.rootBounds === null || record.rootBounds === undefined) {
          rootBoundsInfo = 100;
       } else {
          rootBoundsInfo = record.rootBounds;
       }
        const startedSticking = targetInfo.bottom < rootBoundsInfo.top;
        const stoppedSticking =
          targetInfo.bottom >= rootBoundsInfo.top &&
          targetInfo.bottom < rootBoundsInfo.bottom;

        if (startedSticking) {
          this.sticky = true;
          this.stickyElement.classList.add(selectorsStickyContent.stickyElement);
          this._fireEvent();
        }

        if (stoppedSticking) {
          this.sticky = false;
          this.stickyElement.classList.remove(selectorsStickyContent.stickyElement);
          this._fireEvent();
        }
      });
    });

    this.topObserver.observe(topSentinel);
  }

  _observeBottomSentinel() {
    const bottomSentinel = this.container.querySelector(
      selectorsSticky.stickySentinelBottom
    );
    if (!bottomSentinel) return;

    let previousY = 0;
    this.bottomObserver = new IntersectionObserver((records) => {
      records.forEach((record) => {
        const targetInfo = record.boundingClientRect;
        let rootBoundsInfo;

        if(record.rootBounds === null || record.rootBounds === undefined) {
           rootBoundsInfo = 100;
        } else {
          rootBoundsInfo = record.rootBounds;
        }

        const ratio = record.intersectionRatio;
        const scrollingDown = previousY > record.boundingClientRect.y;
        previousY = record.boundingClientRect.y;

        const startedSticking =
          targetInfo.bottom > rootBoundsInfo.top && ratio === 1;
        const stoppedSticking =
          targetInfo.top < rootBoundsInfo.top &&
          targetInfo.bottom < rootBoundsInfo.bottom;

        if (!scrollingDown && startedSticking) {
          this.sticky = true;
          this.stickyElement.classList.add(selectorsStickyContent.stickyElement);
          this._fireEvent();
        }

        if (stoppedSticking) {
          this.sticky = false;
          this.stickyElement.classList.remove(selectorsStickyContent.stickyElement);
          this._fireEvent();
        }
      });
    });

    this.bottomObserver.observe(bottomSentinel);
  }
}

const selectorsTabs = {
  scrollerContent: '[data-scroller-content]',
  productTabs: '[data-product-tabs-tab]',
  productTabsSelectedTab: '[data-product-tabs-selected-tab]',
  productTabsPanel: '[data-product-tabs-tab-panel]',
  productTabsWrapper: '[data-product-tabs-wrapper]', 
  productTabsTemplatePage: '[template-page-js]'
};

const selectorsTabsContent = {
  productTabsPanelActive: 'product-tabs__panel--active',
  productTabsPanelVisible: 'product-tabs__panel--visible',
  productTabsTabActive: 'product-tabs-tab__item--active',
};


class ProductTabs extends HTMLElement {
  constructor() {
    super(); 
   
    window.theme.initWhenVisible({
      threshold: 0.5,
      callback: this.onLoad.bind(this), 
      element: this
    });
  }

  onLoad() {
    this.elements = this._getElements();

    this.scroller = new Scroller(this);
    this.scroller.init();

    this.stickyNav = new StickyElement(this);
    this.stickyNav.init();

    this.hasSingleTab = Boolean(this.dataset.singleTab);

    this._setupEventHandlers();
  }

  onUnload() {
    if (!this.elements.tabs) return;

    this.stickyNav.destroy();
    this.scroller.destroy();
    this.elements.tabs.forEach((tab) => {
      tab.removeEventListener('click', this.eventHandlers.onClickTabHandler);
      tab.removeEventListener(
        'keydown',
        this.eventHandlers.onKeyDownTabHandler
      );
    }); 
  }

  connectedCallback() {
    window.addEventListener('DOMContentLoaded', () => {
    const selectedBlock = document.querySelector('[data-product-tabs-selected-tab]');
    const selectedBlockContent = document.querySelector('.product-tabs__panel--active');
    if (!selectedBlock) return;
    this.getSectionPage(selectedBlock, selectedBlockContent);  
   });
  }

  onBlockSelect(event) {
    if (this.hasSingleTab) return;

    const selectedBlock = this.querySelector(
      `[data-product-tabs-block-id="${event}"]`
    );

    if (!selectedBlock) return;
    const selectedTab = selectedBlock.dataset.productTabsTabNumber;
    this.showTabPanel(selectedTab);
  }

  _getElements() {
    return {
      tabs: this.querySelectorAll(selectorsTabs.productTabs),
      tabsPanel: this.querySelectorAll(
        selectorsTabs.productTabsPanel
      ),
      tabsPanelWrapper: this.querySelector(
        selectorsTabs.productTabsWrapper
      ),
    };
  }


  _getEventHandlers() {
    return {
      onClickTabHandler: this.onClickTabHandler.bind(this),
      onKeyDownTabHandler: this.onKeyDownTabHandler.bind(this),
      onKeyUpTabHandler: this.onKeyUpTabHandler.bind(this),
    };
  }

  _setupEventHandlers() {
    this.eventHandlers = this._getEventHandlers();

    if (!this.elements.tabs || this.hasSingleTab) return;

    this.elements.tabs.forEach((tab) => {
      tab.addEventListener('click', this.eventHandlers.onClickTabHandler);
      tab.addEventListener('keydown', this.eventHandlers.onKeyDownTabHandler);
      tab.addEventListener('keyup', this.eventHandlers.onKeyUpTabHandler);
    });
  }

  /**
   * Keyboard event callback
   * Make the tab list keyboard navigation friendly with Home, End, Left arrow, Right arrow keys
   * @param {Object} event Event object
   */
  onKeyDownTabHandler(event) {
    const preventKeys = [
      keyCodes.HOME,
      keyCodes.END,
      keyCodes.RIGHT,
      keyCodes.LEFT,
    ];

    if (preventKeys.includes(event.key.toLowerCase())) {
      event.preventDefault();
    }
  }

  /**
   * Keyboard event callback
   * Make the tab list keyboard navigation friendly with Home, End, Left arrow, Right arrow keys
   * @param {Object} event Event object
   */
  onKeyUpTabHandler(event) {
    const currentElement = event.currentTarget;
    const lastElementIndex = this.elements.tabs.length - 1;
    const currentElementIndex = Number(
      currentElement.dataset.productTabsTabNumber
    );

    let index = -1;
    switch (event.key.toLowerCase()) {
      case keyCodes.HOME: {
        index = 0;
        break;
      }
      case keyCodes.END: {
        index = lastElementIndex;
        break;
      }
      case keyCodes.RIGHT: {
        index =
          currentElementIndex === lastElementIndex
            ? 0
            : currentElementIndex + 1;
        break;
      }
      case keyCodes.LEFT: {
        index =
          currentElementIndex === 0
            ? lastElementIndex
            : currentElementIndex - 1;
        break;
      }
    }

    if (index !== -1 && currentElementIndex !== index) {
      event.preventDefault();
      this.showTabPanel(index);
    }
  }

 

  onClickTabHandler(event) {
    const index = event.currentTarget.dataset.productTabsTabNumber;
    this.showTabPanel(index);
  } 

  getSectionPage(currentTab, currentTabPanel) {
    let tabContentSpinner = '';
    const attributeEditor = 'data-shopify-editor-section';
    const { productTabsTemplatePage } = selectorsTabs;
    const { productTabsTabActive } = selectorsTabsContent;
  
    const template = currentTabPanel.querySelector(productTabsTemplatePage);
    const loadedSection = currentTabPanel.querySelector('.loading-section');
  
    if (!template || loadedSection) return;
   
    const pageUrl = currentTab.getAttribute('data-page-url');
    const targetPageTab = currentTab.hasAttribute('data-page-url') && currentTab.classList.contains(productTabsTabActive);
  
    if (!targetPageTab) return;
    
    tabContentSpinner += `<div class="loading-overlay__spinner d-flex justify-content-center">
    <svg
      aria-hidden="true"
      focusable="false"
      class="spinner"
      viewBox="0 0 66 66"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle>
    </svg>
  </div>`

    // Show loading spinner
    const preloader = document.createElement('div');
    preloader.className = 'preloader d-flex justify-content-center';
    preloader.innerHTML =  tabContentSpinner; 
    currentTabPanel.append(preloader);

    fetch(pageUrl)
      .then(response => response.text())
      .then(responseText => {
          
        preloader.remove(); // Hide loading spinner

        const responseHTML = new DOMParser().parseFromString(responseText, 'text/html');
        const pageElements = [...responseHTML.querySelectorAll('section[id^="shopify-section-template-"]')];
  
        if (!pageElements) return; 
  
        pageElements.forEach(pageElem => {
          const elemSection = document.createElement('div');
          const attributes = pageElem.attributes;
          for (let i = 0; i < attributes.length; i++) {
            elemSection.setAttribute(attributes[i].name, attributes[i].value);
            if (elemSection.hasAttribute(attributeEditor)) {
              elemSection.removeAttribute(attributeEditor);  
            }
          }
          elemSection.innerHTML = pageElem.innerHTML;  
          pageElem.parentNode.replaceChild(elemSection, pageElem);
          elemSection.classList.add('loading-section');  
          template.append(elemSection);    
        });
       
      })
      .catch(error => console.error(`Failed to load content for tabs`, error));
  }

  /**
   * Show the correct tabpanel, adjust the aria attributes and classes accordingly
   * @param {Number} index The position of the tabpanel
   */
  
  showTabPanel(index) {
    const targetTab = this.elements.tabs[index];

    const offsetPosition =
      this.elements.tabsPanelWrapper.getBoundingClientRect().top + window.pageYOffset - 250;  

    if (this.stickyNav.isSticky()) {
      window.scrollTo({
        top: offsetPosition,
      });
    }

    this.elements.tabs.forEach((tab) => {
      tab.classList.remove(selectorsTabsContent.productTabsTabActive);
      tab.setAttribute('aria-selected', false);
      tab.setAttribute('tabindex', -1);
      delete tab.dataset.productTabsSelectedTab;
      tab.blur();
    });

    targetTab.classList.add(selectorsTabsContent.productTabsTabActive);
    targetTab.setAttribute('aria-selected', true);
    targetTab.setAttribute('tabindex', 0);
    targetTab.dataset.productTabsSelectedTab = true;
    targetTab.focus();

    this.scroller.makeElementVisible(targetTab);

    const targetPanel = this.elements.tabsPanel[index];
    if (!targetPanel) return;

    this.elements.tabsPanel.forEach((tabPanel) => {
      tabPanel.classList.remove(selectorsTabsContent.productTabsPanelVisible);
      tabPanel.classList.remove(selectorsTabsContent.productTabsPanelActive);
    });

    targetPanel.classList.add(selectorsTabsContent.productTabsPanelActive);
    window.requestAnimationFrame(() =>
      targetPanel.classList.add(selectorsTabsContent.productTabsPanelVisible)
    );

    this.getSectionPage(targetTab, targetPanel);
  }
  
}

customElements.define('product-tabs', ProductTabs);

