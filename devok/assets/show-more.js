if (!customElements.get('show-more-button')) {
  customElements.define(
    'show-more-button',
    class ShowMoreButton extends HTMLElement {
      constructor() {
        super();
        const button = this.querySelector('button');
        button.addEventListener('click', (event) => {
          this.expandShowMore(event); 
          const firstElement = event.target.closest('.parent-display').querySelector('.parent-wrap').querySelector('.variant-item:first-child'); 
          const nextElementToFocus = event.target.closest('.parent-display').querySelector('.show-more-item');
          if (nextElementToFocus && !nextElementToFocus.classList.contains('hidden') && nextElementToFocus.querySelector('input')) {
            nextElementToFocus.querySelector('input').focus();  
          } else {
            this.scrollParentDisplayIntoView(firstElement);   
          } 
        }); 
      }

      expandShowMore(event) {
        const parentDisplay = event.target.closest('[id^="Show-More-"]').closest('.parent-display');
        // const parentWrap = parentDisplay.querySelector('.parent-wrap');
        this.querySelectorAll('.label-text').forEach((element) => element.classList.toggle('hidden'));
        parentDisplay.querySelectorAll('.show-more-item').forEach((item) => item.classList.toggle('hidden'));
        if (!this.querySelector('.label-show-less')) {
          this.classList.add('hidden');
        }
      }
      scrollParentDisplayIntoView(item) {
         if (!item) return;
         else item.scrollIntoView({ behavior: 'smooth' }); 
      }
    }
  );
}
