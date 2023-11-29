if (!customElements.get('product-gallery')) {
  customElements.define('product-gallery', class ProductGallery extends HTMLElement {
    constructor() {
      super();
  
      this.gallery = this.querySelector('[id^="ProductGalleryViewer-"]');
      this.init();  
  
      // Add resize observer to update container height
      const resizeObserver = new ResizeObserver(entries => this.update());
      resizeObserver.observe(this); 
    
      // Bind event listeners
      this.navItems.forEach(item => item.addEventListener('click', this.onNavItemClick.bind(this)))
      this.pagItems.forEach(item => item.addEventListener('click', this.onNavItemClick.bind(this)))      
      this.prevButton.addEventListener('click', this.onButtonClick.bind(this)); 
      this.nextButton.addEventListener('click', this.onButtonClick.bind(this));   
  
      // Listen for variant selection change to make current variant image active
      window.addEventListener('message', this.onVariantChange.bind(this))
    }
  
  
    init() { 
      // Set up our DOM element variables
      this.imagesContainer = this.gallery.querySelector('.product-gallery__images');
      this.navContainer = this.gallery.querySelector('.product-gallery__nav');  
      this.pagContainer = this.gallery.querySelector('.product-gallery__pag');  
      this.navItems = this.gallery.querySelectorAll('.product-gallery__nav-item:not(.hidden)');
      this.pagItems = this.gallery.querySelectorAll('.product-gallery__pag-item:not(.hidden)');
      this.images = this.gallery.querySelectorAll('.product-gallery__image:not(.hidden)'); 
      this.prevButton = this.gallery.querySelector('button[name="previous"]');
      this.nextButton = this.gallery.querySelector('button[name="next"]');
      this.currentSlideElement = this.gallery.querySelector('.slider-counter--current');
      this.pageTotalElement = this.gallery.querySelector('.slider-counter--total');
  
      // If there is no active images set the first image to active
    
        if (this.findCurrentIndex() === -1) {
          this.setCurrentImage(this.images[0]);
          this.setCurrentNav(this.navItems[0]);
          this.setCurrentPag(this.pagItems[0]);
        }    
  
      this.updateCounter();  
    }        
          
  
    onVariantChange(event) {    
      const { data } = event;
      if (filterMedia === true) {
        this.init(); 
      }  
      if (!data || data.type !== 'variant_changed' || !data.variant.featured_media) {
        return;
      }
      if (filterMedia === true) {
        this.setCurrentImage(this.images[0]);
        this.setCurrentNav(this.navItems[0]); 
        this.setCurrentPag(this.pagItems[0]); 
        this.scrollToNavCurrent(this.navItems[0], this.navContainer) 
      } else {
        const currentImage = Array.from(this.images).find(item => item.dataset.mediaId == data.variant.featured_media.id);
        const currentNav = Array.from(this.navItems).find(item => item.dataset.mediaId == data.variant.featured_media.id);
        const currentPag = Array.from(this.pagItems).find(item => item.dataset.mediaId == data.variant.featured_media.id); 
        if (currentImage) {
          this.setCurrentImage(currentImage);
        } 
        if (currentPag) {
          this.setCurrentPag(currentPag);
        }
        if (currentNav) {
          this.setCurrentNav(currentNav);
          this.scrollToNavCurrent(currentNav, this.navContainer); 
        }
      }
  
      this.updateCounter();
    }
  
    onNavItemClick(event) {
      const mediaId = event.target.closest('li').dataset.mediaId 
      this.images.forEach(item => item.classList.remove('product-gallery__image--active'))
      this.navItems.forEach(item => item.classList.remove('product-gallery__nav-item--active'))
      this.pagItems.forEach(item => item.classList.remove('product-gallery__pag-item--active')) 
      this.setCurrentImage(Array.from(this.images).find(item => item.dataset.mediaId === mediaId))
      this.setCurrentNav(Array.from(this.navItems).find(item => item.dataset.mediaId === mediaId)) 
      this.setCurrentPag(Array.from(this.pagItems).find(item => item.dataset.mediaId === mediaId))  
      
      const navActive = this.getActiveNav(); 
      this.scrollToNavCurrent(navActive, this.navContainer) 
      this.updateCounter();     
      this.update(); 
    }
  
    getActiveNav() {
      return Array.from(this.navItems).find(item => item.classList.contains('product-gallery__nav-item--active')) 
    } 
  
    updateCounter() {
      this.totalPages = this.images.length;
      let index = this.findCurrentIndex();
      this.currentIdxSlide = index + 1;
      if (this.currentSlideElement && this.pageTotalElement) {
        this.currentSlideElement.textContent =  this.currentIdxSlide;
        this.pageTotalElement.textContent = this.totalPages; 
      }
    }
  
    update() {
      this.gallery.style.height = `${this.imagesContainer.offsetHeight}px`; 
      this.prevButton.removeAttribute('disabled') 
      this.nextButton.removeAttribute('disabled')
      if (this.findCurrentIndex() === 0) this.prevButton.setAttribute('disabled', true)
      if (this.findCurrentIndex() === this.images.length - 1) this.nextButton.setAttribute('disabled', true)
      if (this.findCurrentIndex() === this.images.length - 1)
      this.updateCounter();
    }
  
    setCurrentNav(elem) {
      if(!elem) return; 
      this.navItems.forEach(item => item.classList.remove('product-gallery__nav-item--active'));
      elem.classList.add('product-gallery__nav-item--active');
      this.update();
    }
  
    setCurrentPag(elem) {
      if(!this.pagContainer || !elem) return;
      this.pagItems.forEach(item => item.classList.remove('product-gallery__pag-item--active'));
      elem.classList.add('product-gallery__pag-item--active');
      this.update(); 
    }
  
    setCurrentImage(elem) {
      if(!elem) return; 
      this.images.forEach(item => item.classList.remove('product-gallery__image--active'));
      elem.classList.add('product-gallery__image--active');
      this.playActiveMedia(elem); 
      this.update();  
    }
  
    playActiveMedia(activeItem) {
      window.pauseAllMedia();
      const deferredMedia = activeItem.querySelector('.deferred-media');
      if (deferredMedia) deferredMedia.loadContent(false); 
    }
  
    findCurrentIndex() {
      return Array.from(this.images).findIndex(item => item.classList.contains('product-gallery__image--active'));
    }
  
    findCurrentIdxNav() {
      return Array.from(this.navItems).findIndex(item => item.classList.contains('product-gallery__nav-item--active'));
    }
  
    findCurrentIdxPag() {
      return Array.from(this.pagItems).findIndex(item => item.classList.contains('product-gallery__pag-item--active'));
    }
  
    scrollToNavCurrent(element, container) { 
      const thumbnailTop = element.offsetTop;
      const thumbnailHeight = element.offsetHeight;
      const containerHeight = container.offsetHeight;
      let scrollTo = thumbnailTop - ((containerHeight - thumbnailHeight) / 2);
  
      // Ensure scrollTo is within the valid range
      scrollTo = Math.max(0, Math.min(scrollTo, container.scrollHeight - containerHeight));
  
      container.scrollTo({
        top: scrollTo,
        behavior: 'smooth' 
      });
    }
  
    onButtonClick(event) {
      const { name } = event.currentTarget;
      event.preventDefault();
      
      const currentIndex = this.findCurrentIndex();
      const nextIndex = name === 'next' ? currentIndex + 1 : currentIndex - 1;
      const currentNavIndex = this.findCurrentIdxNav();
      const currentPagIndex = this.findCurrentIdxPag();
      const nextNavIndex = currentNavIndex + (name === 'next' ? 1 : -1);
      const nextPagIndex = currentPagIndex + (name === 'next' ? 1 : -1);
      
      this.updateCurrentIndex(nextIndex);
      this.updateCurrentNav(this.navItems[nextNavIndex]);
      this.updateCurrentPag(this.pagItems[nextPagIndex]);
      this.scrollToNavCurrent(this.navItems[nextNavIndex], this.navContainer);
    }
    
    updateCurrentIndex(index) {
      this.currentIdxSlide = index + 1;
      if (this.currentSlideElement && this.pageTotalElement) {
        this.currentSlideElement.textContent = this.currentIdxSlide;
      }
      this.setCurrentImage(this.images[index]); 
    }
    
    updateCurrentNav(navItem) {
      this.setCurrentNav(navItem);
    }
    
    updateCurrentPag(pagItem) {
      this.setCurrentPag(pagItem); 
    }
  });
}














