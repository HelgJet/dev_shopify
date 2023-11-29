if (!customElements.get('image-compare-container')) {
  customElements.define(
    'image-compare-container',
    class ImageCompareContainer extends HTMLElement {
      constructor() {
        super();
        this.container = this.querySelector('[id^=ImageCompareContainer-]');
        this.active = false; 
        this.startX = 0;
        this.currentX = 0;
        this.startValue = 0;
        this.touching = false;
        this.scroller = this.querySelector('.scroller');
        this.afterImage = this.querySelector('.after-image'); 
        this.widthContainer = this.container.clientWidth;
        this.scrollerValue = this.scroller.dataset.startPoint / 100;

        // Bind event handlers to the class instance
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleTouchCancel = this.handleTouchCancel.bind(this); 

        window.theme.initWhenVisible({
          threshold: 0.5,
          callback: this.init.bind(this), 
          element: this 
        });
      }

      
      init() {
        this.startValue = Math.ceil(this.widthContainer * this.scrollerValue);
        this.scroller.style.left = `${this.startValue}px`;
        this.afterImage.style.width = `${this.startValue}px`;

        // Perform the initial scroll
        this.scrollIt(this.startValue);
      }

      connectedCallback() {
        // Add event listeners when the component is connected to the DOM
        this.scroller.addEventListener('mousedown', this.handleMouseDown);
        document.body.addEventListener('mouseup', this.handleMouseUp);
        document.body.addEventListener('mouseleave', this.handleMouseLeave);
        this.container.addEventListener('mousemove', this.handleMouseMove); 

        this.scroller.addEventListener('touchstart', this.handleTouchStart);
        this.scroller.addEventListener('touchmove', this.handleTouchMove);
        this.scroller.addEventListener('touchend', this.handleTouchEnd);
        this.scroller.addEventListener('touchcancel', this.handleTouchCancel);

        // Set initial state and apply styles
        this.active = false; 
      }

      disconnectedCallback() {
         // Remove event listeners when the component is disconnected from the DOM
        this.scroller.removeEventListener('mousedown', this.handleMouseDown);
        document.body.removeEventListener('mouseup', this.handleMouseUp);
        document.body.removeEventListener('mouseleave', this.handleMouseLeave);
        this.container.removeEventListener('mousemove', this.handleMouseMove);

        this.scroller.removeEventListener('touchstart', this.handleTouchStart);
        this.scroller.removeEventListener('touchmove', this.handleTouchMove);
        this.scroller.removeEventListener('touchend', this.handleTouchEnd);
        this.scroller.removeEventListener('touchcancel', this.handleTouchCancel);
      }

        scrollIt(x) {
          const transform = Math.max(0, Math.min(x, this.container.offsetWidth));
          this.afterImage.style.width = `${transform}px`;
          this.scroller.style.left = `${transform - 15}px`; 
        }

        handleMouseDown() {
          this.active = true;
          this.scroller.classList.add('scrolling');
        }

        handleMouseUp() {
          this.active = false;
          this.scroller.classList.remove('scrolling');
        }

        handleMouseLeave() {
          this.active = false;
          this.scroller.classList.remove('scrolling');
        }

        handleMouseMove(e) {
          if (!this.active) return;
          const x = e.pageX - this.container.getBoundingClientRect().left;
          this.scrollIt(x);
        }

        handleTouchStart() {
          this.active = true;
          this.scroller.classList.add('scrolling');
          this.touching = true;
        }

        handleTouchMove(e) {
          if (!this.touching) return;
          const touch = e.touches[0];
          this.currentX = touch.pageX - this.container.getBoundingClientRect().left;
          const diffX = this.currentX - this.startX;
          this.scrollIt(this.currentX);
        }

        handleTouchEnd() {
          if (!this.touching) return;
          this.active = false;
          this.scroller.classList.remove('scrolling');
          this.touching = false; 
        }

        handleTouchCancel() {
          if (!this.touching) return;
          this.active = false;
          this.scroller.classList.remove('scrolling');
          this.touching = false;
        }
    }
  );
}