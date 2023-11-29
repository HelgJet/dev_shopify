if (!customElements.get('drawer-dialog')) {
  customElements.define('drawer-dialog', class DrawerDialog extends HTMLElement {
    openerBy;

    constructor() {
      super();

      this.onBodyClick = this.handleBodyClick.bind(this);

      const closeButton = this.querySelector('button');
      closeButton.addEventListener('click', () => {
        this.hide();
      });

      this.addEventListener('keyup', (event) => {
        if (event.code.toUpperCase() === 'ESCAPE') this.hide();
      });
    }

    handleBodyClick(evt) {
      const target = evt.target; 
      if (target !== this && !target.closest('drawer-dialog') && !target.closest('.product-drawer__button')) {
        this.hide(); 
      }
    }

    hide() {
      this.removeAttribute('open');
      document.body.removeEventListener('click', this.onBodyClick);
      document.body.classList.remove('overflow-hidden');
      removeTrapFocus(this.openerBy);
    }

    show(opener) {
      this.openerBy = opener;
      this.setAttribute('open', '');
      document.body.addEventListener('click', this.onBodyClick);
      document.body.classList.add('overflow-hidden');
      trapFocus(this);
    }
  });
}

if (!customElements.get('drawer-opener')) {
  customElements.define('drawer-opener', class DrawerOpener extends HTMLElement {
    constructor() {
      super();
      const button = this.querySelector('button');
      if (!button) return;
      button.addEventListener('click', () => {
        const drawer = document.querySelector(this.getAttribute('data-drawer'));
        if (drawer) drawer.show(button);
      });
    }

    connectedCallback() {
      const linkRew = document.querySelector('[data-block-handle="star_rating"] .link');
      if (!linkRew) return;
      document.addEventListener('click', (event) => {
        if (event.target === linkRew && this.querySelector('[data-drawer-reviews]')) {
          const drawer = document.querySelector(this.getAttribute('data-drawer'));
          if (drawer) drawer.show(linkRew);
        }
      });
    }
  }); 
}
