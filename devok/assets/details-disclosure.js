class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.mainDetailsToggle = this.querySelector('details');
    this.content = this.mainDetailsToggle.querySelector('summary').nextElementSibling;
    this.useHoverEnabled = this.getAttribute('data-openbyhover') === 'true';

    this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));
    this.mainDetailsToggle.addEventListener('toggle', this.onToggle.bind(this));
    
    if (this.useHoverEnabled){
      this.mainDetailsToggle.addEventListener('mouseenter', this.onMouseEnter.bind(this));
      this.mainDetailsToggle.addEventListener('mouseleave', this.onMouseLeave.bind(this)); 
      this.openedDetails = null;
      this.previousDetails = null;  
      window.addEventListener('mousedown', this.onWindowClick.bind(this)); 
      this.content.addEventListener('mouseleave', this.onContentMouseLeave.bind(this));
      // Add a variable to track the timeout for mouseleave
      this.mouseLeaveTimeout = null;
    } 
  }

  onWindowClick(event) {
    if (!this.contains(event.target) && !this.content.contains(event.target)) {
      setTimeout(() => {
        this.close();
        this.openedDetails = null;
      }); 
    }
  }

  onMouseEnter() {
    clearTimeout(this.mouseLeaveTimeout); // Clear the timeout when the mouse enters
    this.open();
    this.previousDetails = this.openedDetails;
    this.openedDetails = this.mainDetailsToggle;
  }

  onMouseLeave(event) {
    const hoveredDetails = !event.relatedTarget?.closest('details');
    const hoveredTarget = !this.contains(event.target) && !this.content.contains(event.target) && !event.relatedTarget?.closest('details');
    if (!hoveredDetails) {
      this.mouseLeaveTimeout = setTimeout(() => {
        this.close(); 
      }, 100); 
    } else if (!hoveredTarget){
      this.mouseLeaveTimeout = setTimeout(() => {
        this.close();
        this.openedDetails = null;
      }, 1500);  
    } else {
      clearTimeout(this.mouseLeaveTimeout); // Clear the timeout if the mouse re-enters
    }
  }

  onContentMouseLeave(event) {
    if (!event.relatedTarget || !event.relatedTarget.closest('details')) {
      setTimeout(() => {
        this.close();
        this.openedDetails = null; 
      }); 
    }
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    this.checkAnimation();  
  }

  open() {
    this.mainDetailsToggle.setAttribute('open', '');
    this.checkAnimation();
    this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', true); 
  }

  close() {
    this.mainDetailsToggle.removeAttribute('open');
    if (!this.animations) this.animations = this.content.getAnimations();
    this.animations.forEach((animation) => animation.cancel());
    this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
  }

  checkAnimation() { 
    if (!this.animations) this.animations = this.content.getAnimations();
    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.animations.forEach((animation) => animation.play());
    } else {
      this.animations.forEach((animation) => animation.cancel());
    }
  }
}

customElements.define('details-disclosure', DetailsDisclosure);

class HeaderMenu extends DetailsDisclosure {
  constructor() { 
    super();
    this.header = document.querySelector('.header-wrapper');
  }

  onToggle() {
    if (!this.header) return;
    this.header.preventHide = this.mainDetailsToggle.open;

    if (document.documentElement.style.getPropertyValue('--header-bottom-position-desktop') !== '') return;
    document.documentElement.style.setProperty('--header-bottom-position-desktop', `${Math.floor(this.header.getBoundingClientRect().bottom)}px`);
  }
}

customElements.define('header-menu', HeaderMenu);
