if (!customElements.get('devok-fbt')) {
  customElements.define('devok-fbt', class FrequentlyBoughtTogether extends HTMLElement {
    constructor() {
      super();
  
      window.theme.initWhenVisible({
        threshold: 0.5,
        callback: this.init.bind(this),
        element: this
      }); 
    } 

    init(){
      this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer') || document.querySelector('cart-dropdown');
      this.variantsIds = this.querySelector('#product-variants-ids'); 
      this.Shopify_new_arr = []; 
      this.container = this;
      this.lastFrequentlyImage = null;
    }
    
    connectedCallback() {
      this.setupEventListeners();
    }

    setupEventListeners() { 
      this.initArray();
      this.setupCheckboxes();
      this.setupProductSelect();
      this.setupAddToCart();  
    }

    setupCheckboxes() {
      this.querySelectorAll('.devok-fbt-checkbox > input').forEach(checkbox => {
          checkbox.addEventListener('change', event => {
            setTimeout(() => {
              this.handleCheckboxChange(event); 
              this.initArray();
            }, 100); 
          });
      });
    }

    handleCheckboxChange(event) {
      const checkbox = event.target;
      const checkboxValue = checkbox.getAttribute('data-ids-val');
      const frequentlyPriceTitle = this.querySelector(`.${checkboxValue}`); 
      const frequentlyImage = this.querySelector(`.devok-fbt-images .${checkboxValue}`);
      const dataIndexElements = this.querySelectorAll(`[data-index="${checkboxValue}"]`); 
      const checkboxes = this.querySelectorAll('.input-checkbox-js');
      const isChecked = checkbox.checked; 
    
        dataIndexElements.forEach(element => {
          element.classList.toggle('fbt-product-added--js', isChecked);
        });
    
        if (frequentlyPriceTitle && frequentlyImage) {
          frequentlyImage.classList.toggle('visually-hidden', !isChecked); 
        } 

        if (![...this.querySelectorAll('.devok-fbt--info-wrapper')].some(element => element.classList.contains('fbt-product-added--js'))) {
          this.querySelector('.devok-fbt-atc').setAttribute('disabled', 'disabled');
        } else {
          this.querySelector('.devok-fbt-atc').removeAttribute('disabled'); 
        }

        if (isChecked) {
          this.hidePlusIconInLastVisibleImageText(checkboxes, event); 
        } else {
            this.updatePlusIconsVisibility(checkboxes); 
        } 

        updateTotalPrice(this.container); 
    }

    updatePlusIconsVisibility(checkboxes) {
      const lastVisibleCheckbox = Array.from(checkboxes).reverse().find(checkbox => checkbox.checked);
      if (lastVisibleCheckbox) {
        const lastVisibleCheckboxValue = lastVisibleCheckbox.getAttribute('data-ids-val');
        const lastVisibleImage = this.querySelector(`.devok-fbt-images .${lastVisibleCheckboxValue}`);
        const plusIcon = lastVisibleImage.querySelector('.plus_icon');
        if (plusIcon) {
          plusIcon.classList.add('visually-hidden'); 
        }
      }
    }

   
    hidePlusIconInLastVisibleImageText(checkboxes, event) {
      const lastVisibleCheckbox = Array.from(checkboxes).reverse().find(checkbox => checkbox.checked);
      const firstVisibleCheckbox = Array.from(checkboxes).find(checkbox => checkbox.checked);
      const moreCheckedExist = Array.from(checkboxes).filter(checkbox => checkbox.checked).length > 1; 
      
      if(firstVisibleCheckbox && moreCheckedExist) {
        const firstVisibleCheckboxValue = firstVisibleCheckbox.getAttribute('data-ids-val');
        const firstVisibleImage = this.querySelector(`.devok-fbt-images .${firstVisibleCheckboxValue}`);
        const plusFirstIcon = firstVisibleImage.querySelector('.plus_icon');  
        if (plusFirstIcon) {
          plusFirstIcon.classList.remove('visually-hidden');    
        }
      }
     
      if (lastVisibleCheckbox) {
        const lastVisibleCheckboxValue = lastVisibleCheckbox.getAttribute('data-ids-val');
        const lastVisibleImage = this.querySelector(`.devok-fbt-images .${lastVisibleCheckboxValue}`);
       
        let plusLastIcon; 
        if(lastVisibleImage.previousElementSibling){
           plusLastIcon = lastVisibleImage.previousElementSibling.querySelector('.plus_icon'); 
           if (plusLastIcon) {
            plusLastIcon.classList.remove('visually-hidden');  
          }
        }

        const plusIcon = lastVisibleImage.querySelector('.plus_icon'); 
        if (plusIcon) {
          plusIcon.classList.add('visually-hidden'); 
        }
      }  

      if (event.target && event.target.previousElementSibling) {
        const visibleCheckboxValue =  event.target.previousElementSibling.getAttribute('data-ids-val');
        const visibleImage = this.querySelector(`.devok-fbt-images .${visibleCheckboxValue}`);
        const icon = visibleImage.querySelector('.plus_icon');  
        if (icon) {
          icon.classList.remove('hidden');    
        }
      }
    }
  
    setupProductSelect() {
      this.addEventListener('change', event => {
          if (event.target.matches('.selector-for-featured-product')) {
             this.initArray(); 
          }
      });
    }

    setupAddToCart() {
      this.querySelector('.devok-fbt-atc')?.addEventListener('click', () => {
        this.addToCart(); 
      });
    }

    
    initArray() {
      if (this.variantsIds) {
        this.updateShopifyArray(); 
      }
    }

    updateShopifyArray() { 
      const itemsIds = this.getItemsIds(); 
      this.Shopify_new_arr = itemsIds;
      this.variantsIds.value = itemsIds.join(',');
    }

    getItemsIds() {
      const ids = this.querySelectorAll('.fbt-product-added--js [name="fid"]'); 
      return [...ids].map((e) => e.value);    
    }

    addToCart() {
        var items = this.Shopify_new_arr.map(variantId => {
            return {
                id: variantId,
                quantity: 1
            };
        });

        var data = {
            items: items
        };

        fetch(window.Shopify.routes.root + 'cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With':'xmlhttprequest'
          },
          body: JSON.stringify(data)
        })
        .then(response => {
          return response.json();  
        })
        .then(data => {
          window.location = window.routes.cart_url;
          return; 
        })
        .catch((error) => {
          console.error('Error:', error); 
        })
        .finally(() => {
          if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
        });
    }
  });
}


class BundleVariantSelects extends HTMLElement {
  constructor() {
    super();
    this.sectionID = this.dataset.sectionId;  
    this.container = document.getElementById(`frequently-products-template-${this.sectionID}`);
    this.addEventListener('change', this.onVariantSelected); 
  } 

  onVariantSelected() { 
    this.updateOptions();
    this.updateMasterId();
    this.updateVariantStatuses();
    this.updateMedia();

    if (this.currentVariant) {
      this.updateVariantInput(); 
      this.renderProductInfoFrequently();
      // When variant is changed post a message with the variant's data
      window.postMessage({
        type: 'variant_changed',
        variant: this.currentVariant
      }, '*')
    }
  }

  updateOptions() {
    this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData()?.find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return; 

    const mediaGalleries = this.container.querySelectorAll(`[id^="ProductGallery-${this.dataset.product}"]`);
    mediaGalleries.forEach(mediaGallery => mediaGallery.setActiveMedia(`${this.dataset.product}-${this.currentVariant.featured_media.id}`, true));
  } 

  updateVariantInput() {
    const productForms = this.container.querySelectorAll(`#product-form-${this.dataset.product}-${this.sectionID}`); 
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="fid"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));  
    });
  }

  updateVariantStatuses() {
    const selectedOptionOneVariants = this.variantData.filter(variant => this.querySelector(':checked').value === variant.option1);
    const inputWrappers = [...this.querySelectorAll('.product-form__input')];
    
    inputWrappers.forEach((option, index) => {
      if (index === 0) return;
      const optionInputs = [...option.querySelectorAll('option')];
      const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
      const availableOptionInputsValue = selectedOptionOneVariants.filter(variant => variant.available && variant[`option${ index }`] === previousOptionSelected).map(variantOption => variantOption[`option${ index + 1 }`]);
      this.setInputAvailability(optionInputs, availableOptionInputsValue);
    });
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach(input => {
      if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
        input.innerText = input.getAttribute('value');
      } else {
        input.innerText = window.variantStrings.soldValueOut.replace('[value]', input.getAttribute('value')); 
      }
    });
  }

  async renderProductInfoFrequently() {
    const requestedVariantId = this.currentVariant.id; 
    const sectionId = this.dataset.product;
    const productUrl = this.dataset.productUrl;
    const dataUrl = `${productUrl}?variant=${requestedVariantId}`; 
   
    this.container.querySelector('.loading-overlay__spinner').classList.remove('hidden');

    try {
      const response = await fetch(dataUrl);
      const responseText = await response.text();
      if (this.currentVariant.id !== requestedVariantId) return;
      const html = new DOMParser().parseFromString(responseText, 'text/html');
      const destination = this.container.querySelector(`#price-${sectionId}`);
      const source = html.querySelector('[id^="MainProduct-"]');
      const sourceId = source.dataset.section; 
      const sourcePrice = source.querySelector(`#price-${sourceId}`);

      if (sourcePrice && destination) {
        destination.innerHTML = sourcePrice.innerHTML;  
      }
      const price = this.container.querySelector(`#price-${sectionId}`);
      if (price) {
        const priceElement = price.querySelector('.price');
        if (priceElement) {
          priceElement.classList.remove('price--large'); 
        }
      }
      
      this.container.querySelector('.loading-overlay__spinner').classList.add('hidden');
      updateTotalPrice(this.container);

      publish(PUB_SUB_EVENTS.variantChange, {
        data: {
          sectionId,
          html,
          variant: this.currentVariant,
        },
      });
    } catch (error) {
      console.error('Error fetching and rendering product info:', error);
    }
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define('bundle-variant-selects', BundleVariantSelects); 


function updateTotalPrice(container) {
  const dataIndexElements = Array.from(container.querySelectorAll('.fbt-product-added--js'));

  let sumRegularPrices = 0;
  let sumCompareRegularPrices = 0;
  let sumSalePrices = 0;
  let comparePrices = 0;
  let deffPrice = 0;

  dataIndexElements.forEach((element) => {
    const regularPriceItem = element.querySelector('.price__regular .price-item--regular'); 
    const compareRegularPriceItem = element.querySelector('.price--on-sale:not(.price--sold-out) .price__sale .price-item--regular');
    const saleItem = element.querySelector('.price--on-sale:not(.price--sold-out) .price__sale .price-item--sale');
   
    const regularSoldOutPriceItem = element.querySelector('.price--sold-out .price__regular .price-item--regular'); 
    const compareSoldOutRegularPriceItem = element.querySelector('.price--sold-out .price__sale .price-item--regular');
    const saleSoldOutItem = element.querySelector('.price--sold-out .price__sale .price-item--sale');   

    const regularPriceValue = extractPriceFromElement(regularPriceItem); 
    const salePriceValue = extractPriceFromElement(saleItem); 
    const compareRegularPriceValue = extractPriceFromElement(compareRegularPriceItem);

    const regularSoldOutPriceValue = extractPriceFromElement(regularSoldOutPriceItem);
    const compareSoldOutRegularPriceValue = extractPriceFromElement(compareSoldOutRegularPriceItem);
    const saleSoldOutPriceValue = extractPriceFromElement(saleSoldOutItem); 

    sumRegularPrices = updatePriceSum(regularPriceValue, sumRegularPrices, regularSoldOutPriceValue);
    sumCompareRegularPrices = updatePriceSum(compareRegularPriceValue, sumCompareRegularPrices, compareSoldOutRegularPriceValue);
    sumSalePrices = updatePriceSum(salePriceValue, sumSalePrices, saleSoldOutPriceValue); 

  }); 

  if (!isNaN(sumCompareRegularPrices) && !isNaN(sumSalePrices) && sumCompareRegularPrices > sumSalePrices) {
    deffPrice = sumCompareRegularPrices - sumSalePrices; 
  }

  if (!isNaN(sumRegularPrices) && !isNaN(deffPrice)) {
    comparePrices = sumRegularPrices + deffPrice;    
  }

  const frequentlyPriceRegular = container.querySelector('#frequently-price-regular');
  const frequentlyPriceSale = container.querySelector('#frequently-price-sale'); 

  if(!isNaN(comparePrices) && !isNaN(deffPrice) && deffPrice > 0) {
    frequentlyPriceRegular.innerText = `${window.theme.Currency.formatMoney(comparePrices, window.theme.moneyFormat)} ${window.theme.moneyCurrency ? window.theme.moneyCurrency : ''}`;
  } else {
    frequentlyPriceRegular.innerText = '';
  }
  frequentlyPriceSale.innerText = `${window.theme.Currency.formatMoney(sumRegularPrices, window.theme.moneyFormat)} ${window.theme.moneyCurrency ? window.theme.moneyCurrency : ''}`;
} 

function updatePriceSum(value, sum, soldOutValue) {
  if (!isNaN(value)) {
    sum += value;
    if (soldOutValue > 0) {
      sum -= soldOutValue;
    }
  }
  return sum;
}

function extractPriceFromElement(element) {
  if (element) {
    const attributeValue =
      element.getAttribute('data-price-regular') ||
      element.getAttribute('data-price-sale') ||
      element.getAttribute('data-price-compare-regular');
    if (attributeValue) {
      const price = parseFloat(attributeValue);
      if (!isNaN(price)) {
        return price;
      }
    }
  }
  return NaN;
}

