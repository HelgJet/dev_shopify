
class CartDropdown extends HTMLElement {
  constructor() {
    super();
    this.header = document.querySelector('.header-wrapper') || document.querySelector('.section-header');
    this.borderOffset = document.querySelector('.header-wrapper').classList.contains('header-wrapper--border-bottom') ? 1 : 0;
    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
  } 

  connectedCallback() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog'); 

    const openHandler = () => {
      this.setHeaderPosition(this.header);
      this.open();
    };
  
    const closeHandler = () => {
      this.close();
      this.removeHeaderPosition();
    };
  
    const mouseEnterHandler = () => {
      openHandler();
    };
  
    const mouseLeaveHandler = () => {
      setTimeout(() => {
        if (!this.activeElement) {
          closeHandler(); 
        }
      }, 100);
    };
  
    const documentMouseLeaveHandler = (event) => {
      if (!this.contains(event.target) && event.target !== this) {
        closeHandler();
      } else if (event.target === cartLink) {
        openHandler();
      }
    };

    const touchStartHandler = (event) => {
      event.preventDefault();
      openHandler();
    };


    cartLink.addEventListener('mouseenter', mouseEnterHandler);
    cartLink.addEventListener('mouseleave', mouseLeaveHandler);
    cartLink.addEventListener('touchstart', touchStartHandler);
    window.addEventListener('mouseleave', documentMouseLeaveHandler);
    this.addEventListener('mouseleave', closeHandler);
    window.addEventListener('scroll',  closeHandler); 

    document.addEventListener('click', (event) => {
      if (!this.contains(event.target) && event.target !== this) {
        closeHandler(); 
      }
    }); 
  }

  setHeaderPosition(el) {
    document.documentElement.style.setProperty('--header-bp', `${Math.floor(el.getBoundingClientRect().bottom - this.borderOffset)}px`);
  } 

  removeHeaderPosition() {
    if (document.documentElement.style.getPropertyValue('--header-bp')) {
      document.documentElement.style.removeProperty('--header-bp'); 
    }
  } 

  open() {
    this.setActiveElement(this);
    this.classList.add('active'); 
    if (!this.animations) this.animations = this.getAnimations();
    if (this.classList.contains('active')) {
      this.animations.forEach((animation) => animation.play());  
    } else {
      this.animations.forEach((animation) => animation.cancel()); 
    }
    this.addEventListener('transitionend', () => {
      const containerToTrapFocusOn = this.classList.contains('is-empty') ? this.querySelector('.drawer__inner-empty') : document.getElementById('CartDropdown');
      const focusElement = this.querySelector('.drawer__inner');
      trapFocus(containerToTrapFocusOn, focusElement);
    }, { once: true });
  }

  close() {
    this.classList.remove('active'); 
    removeTrapFocus(this.activeElement);
  }

  renderContents(parsedState) {
    this.querySelector('.drawer__inner').classList.contains('is-empty') && this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id; 
    this.getSectionsToRender().forEach((section => {
      const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
      sectionElement.innerHTML =
      this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    })); 
  
    setTimeout(() => {
      this.open();
    }); 
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML; 
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-dropdown', 
        selector: '#CartDropdown',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}
customElements.define('cart-dropdown', CartDropdown); 



class CartDropdownItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: 'CartDropdown',
        section: 'cart-dropdown',
        selector: '.drawer__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
    ];
  }
}

customElements.define('cart-dropdown-items', CartDropdownItems);   