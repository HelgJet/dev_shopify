
const loadProductSortView = () => {
  let gridToggle = document.querySelector('[data-desktop-sortviewer]');
  if (!gridToggle) return;
  
    let columns = parseInt(gridToggle.dataset.gridCount);
    let gridInputs = document.querySelectorAll('[data-desktop-sortviewer] input'); 
    let arrayInputsValue;
    arrayInputsValue = Array.prototype.map.call(gridInputs, function(el) {
      return el.value;
    });

    if (!arrayInputsValue.includes(columns)){
      localStorage.setItem('columnView', columns);  
    }

}

const renderProductSortView = () => { 
  let gridToggle = document.querySelector('[data-desktop-sortviewer]');
  if (!gridToggle) return;

    let columns = parseInt(gridToggle.dataset.gridCount);
    let gridContainer = document.querySelector('.product-grid'); 
    let gridInputs = document.querySelectorAll('[data-desktop-sortviewer] input'); 
    let gridClass = 'col-desktop';
 
    let columnsCurrent = JSON.parse(localStorage.getItem('columnView')) || columns;
    localStorage.setItem('columnView', columnsCurrent); 

    gridInputs.forEach(input => { 
      let inputValue = input.getAttribute('value'); 
      input.removeAttribute('checked'); 
      input.parentNode.classList.remove('checked');
      if(inputValue == columnsCurrent) {
        localStorage.removeItem('columnView');     
        input.checked = true;   
        input.parentNode.classList.add('checked');
        localStorage.setItem('columnView', columnsCurrent); 
      }  
    });

    if(gridContainer) {
      gridContainer.classList.remove(`grid--${columns}-${gridClass}`);          
      gridContainer.classList.add(`grid--${columnsCurrent}-${gridClass}`);   
   

      gridToggle.addEventListener('click', function(event) {
        gridInputs.forEach(input => { 
          input.parentNode.classList.remove('checked');   
        });
        if (event.target.type === 'radio' && event.target.name === 'columns') {
            event.target.parentNode.classList.remove('checked');
            gridContainer.classList.remove(`grid--${columnsCurrent}-${gridClass}`);
            localStorage.removeItem('columnView');
            columnsCurrent = parseInt(event.target.value); 
            event.target.parentNode.classList.add('checked'); 
            gridContainer.classList.add(`grid--${columnsCurrent}-${gridClass}`);    
            localStorage.setItem('columnView', columnsCurrent);  
        }
      });  
    }

}

const customSelect = () => {
  let selectDrop, selectDropIs;
  selectDrop = document.getElementsByClassName("select__dropdown");
  selectDropIs = selectDrop.length;  

  if (selectDropIs > 0) {
    let selectDropCurrent, selectDropListWrapper, selectDropListItems, inputsSort, i, y;
    selectDropCurrent = document.querySelector(".select-selected");
    selectDropListWrapper = document.querySelector(".select-items"); 
    inputsSort = document.querySelectorAll('.sort-input-js'); 
    selectDropListItems = document.querySelectorAll(".select-item");
      
    selectDropListItems.forEach(item => { 
      item.addEventListener("click", function (e) {
        for (i = 0; i < inputsSort; i++) { 
          y = this.parentNode.getElementsByClassName("same-as-selected"); 
          selectDropCurrent.innerText = y.innerText;
        }
      });
  });
  } else {
    return;
  }
}


document.addEventListener('DOMContentLoaded', function() {
    loadProductSortView();
    renderProductSortView();
});


class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 500);

    const facetForm = this.querySelector('form');  
    if (facetForm) facetForm.addEventListener('input', this.debouncedOnSubmit.bind(this));

    const facetWrapper = this.querySelector('#FacetsWrapperDesktop, #FacetWrapperDesktopType');
    if (facetWrapper) facetWrapper.addEventListener('keyup', onKeyUpEscape);
    
  }

  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
      customSelect();
    }
    customSelect();
    window.addEventListener('popstate', onHistoryChange);
  }

  static toggleActiveFacets(disable = true) {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.classList.toggle('disabled', disable);
    });
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();
    const countContainer = document.getElementById('ProductCount');
    const countContainerDesktop = document.getElementById('ProductCountDesktop');
    document.getElementById('ProductGridContainer').querySelector('.collection').classList.add('loading');
    if (countContainer){
      countContainer.classList.add('loading');
    }
    if (countContainerDesktop){
      countContainerDesktop.classList.add('loading');
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = element => element.url === url;

      FacetFiltersForm.filterData.some(filterDataUrl) ?
        FacetFiltersForm.renderSectionFromCache(filterDataUrl, event) :
        FacetFiltersForm.renderSectionFromFetch(url, event);
    });

    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then(response => response.text())
      .then((responseText) => {
        const html = responseText;
        FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderProductCount(html);
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderProductCount(html);
  }

  static renderProductGridContainer(html) {
    document.getElementById('ProductGridContainer').innerHTML = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductGridContainer').innerHTML;
    renderProductSortView(); 
    activeWishlist(); 
    activeCompare(); 
  }

  static renderProductCount(html) {
    const count = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductCount').innerHTML;
    const container = document.getElementById('ProductCount');
    const containerDesktop = document.getElementById('ProductCountDesktop');
    container.innerHTML = count;
    container.classList.remove('loading');
    if (containerDesktop) { 
      containerDesktop.innerHTML = count;
      containerDesktop.classList.remove('loading');
    }
  }


  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

    const facetDetailsElements =
      parsedHTML.querySelectorAll('#FacetFiltersForm .js-filter, #FacetFiltersFormType .js-filter,  #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter');
    const matchesIndex = (element) => {
      const jsFilter = event ? event.target.closest('.js-filter') : undefined;
      return jsFilter ? element.dataset.index === jsFilter.dataset.index : false; 
    }
    const facetsToRender = Array.from(facetDetailsElements).filter(element => !matchesIndex(element));
    const countsToRender = Array.from(facetDetailsElements).find(matchesIndex);

    facetsToRender.forEach((element) => {
      document.querySelector(`.js-filter[data-index="${element.dataset.index}"]`).innerHTML = element.innerHTML; 
    });
    
    customSelect();

    FacetFiltersForm.renderActiveFacets(parsedHTML);
    FacetFiltersForm.renderAdditionalElements(parsedHTML);

    if (countsToRender) {
      const closestJSFilterID = event.target.closest('.js-filter').id;
      const currentActiveID = document.activeElement.id;

      if (closestJSFilterID) { 
        FacetFiltersForm.renderCounts(countsToRender, event.target.closest('.js-filter'));
        FacetFiltersForm.renderMobileCounts(countsToRender, document.getElementById(closestJSFilterID));

        const newElementToActivate = document.getElementById(currentActiveID);
        if (newElementToActivate) newElementToActivate.focus(); 
      }
    }
  }

  static renderActiveFacets(html) {
    const activeFacetElementSelectors = ['.active-facets-mobile', '.active-facets-desktop'];

    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    });

    FacetFiltersForm.toggleActiveFacets(false); 
  }

  static renderAdditionalElements(html) {
    const mobileElementSelectors = ['.mobile-facets__open', '.mobile-facets__count', '.sorting'];

    mobileElementSelectors.forEach((selector) => {
      if (!html.querySelector(selector)) return;
      document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
    });

    customSelect();
  
    document.getElementById('FacetFiltersFormMobile').closest('menu-drawer').bindEvents();
  }

  static renderCounts(source, target) {
    const targetSummary = target.querySelector('.facets__summary');
    const sourceSummary = source.querySelector('.facets__summary');
  
    if (sourceSummary && targetSummary) {
      targetSummary.outerHTML = sourceSummary.outerHTML;
    }

    const targetHeaderElement = target.querySelector('.facets__header');
    const sourceHeaderElement = source.querySelector('.facets__header');

    if (sourceHeaderElement && targetHeaderElement) {
      targetHeaderElement.outerHTML = sourceHeaderElement.outerHTML;
    }

    const targetWrapElement = target.querySelector('.facets-wrap'); 
    const sourceWrapElement = source.querySelector('.facets-wrap');  

    if (sourceWrapElement && targetWrapElement) {
      const isShowingMore = Boolean(target.querySelector('show-more-button .label-show-more.hidden'));
      if (isShowingMore) {
        sourceWrapElement
          .querySelectorAll('.facets__item.hidden')
          .forEach((hiddenItem) => hiddenItem.classList.replace('hidden', 'show-more-item'));
      }

      targetWrapElement.outerHTML = sourceWrapElement.outerHTML;
    }
  }

  static renderMobileCounts(source, target) {
    const targetFacetsList = target.querySelector('.mobile-facets__list');
    const sourceFacetsList = source.querySelector('.mobile-facets__list');

    if (sourceFacetsList && targetFacetsList) {
      targetFacetsList.outerHTML = sourceFacetsList.outerHTML;
    }
  }


  static updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  static getSections() {
    return [
      {
        section: document.getElementById('product-grid').dataset.id,
      },
    ];
  }

  createSearchParams(form) {
    const formData = new FormData(form);
    return new URLSearchParams(formData).toString();
  }

  onSubmitForm(searchParams, event) {
    FacetFiltersForm.renderPage(searchParams, event);
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const sortFilterForms = document.querySelectorAll('facet-filters-form form');
    if (event.srcElement.className == 'mobile-facets__checkbox') {
      const searchParams = this.createSearchParams(event.target.closest('form'));
      this.onSubmitForm(searchParams, event);
    } else {
      const forms = [];
      const isMobile = event.target.closest('form').id === 'FacetFiltersFormMobile';

      sortFilterForms.forEach((form) => {
        if (!isMobile) {
          if (form.id === 'FacetSortForm' || form.id === 'FacetFiltersForm' || form.id === 'FacetFiltersFormType' || form.id === 'FacetSortDrawerForm') {
            const noJsElements = document.querySelectorAll('.no-js-list');
            noJsElements.forEach((el) => el.remove());
            forms.push(this.createSearchParams(form));
          }
        } else if (form.id === 'FacetFiltersFormMobile') {
          forms.push(this.createSearchParams(form));
        }
      });
      this.onSubmitForm(forms.join('&'), event)
    }
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    FacetFiltersForm.toggleActiveFacets();
    const url = event.currentTarget.href.indexOf('?') == -1 ? '' : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);
    FacetFiltersForm.renderPage(url);
  }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();

class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.setupPriceRangeSlider();
    this.setupEventListeners();
    this.updatePriceDisplay();
  }

  setupEventListeners() {
    this.querySelectorAll('input').forEach((element) => {
      element.addEventListener('change', this.onRangeChange.bind(this));
    });
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.updatePriceDisplay();
    this.setupPriceRangeSlider();
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute('min'));
    const max = Number(input.getAttribute('max'));

    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }

  updatePriceDisplay() {
    const parent = this.querySelector(".price-slider-container");
    if (!parent) return;

    const minPriceContainer = this.querySelector('[data-price-min]');
    const maxPriceContainer = this.querySelector('[data-price-max]');

    const inputs = this.querySelectorAll('input');
    const minInput = inputs[0];
    const maxInput = inputs[1]; 

    const formatMoney = (value) => window.theme.Currency.formatMoney(value * 100);

    minPriceContainer.innerText = minInput.value ? formatMoney(minInput.value) : 0;
    maxPriceContainer.innerText = maxInput.value ? formatMoney(maxInput.value) : formatMoney(maxInput.getAttribute('max') * 100);
  }

  setupPriceRangeSlider() {
    const parent = this.querySelector(".price-slider-container");
    if (!parent) return;

    const rangeSlider = this.querySelectorAll("input[type=range]");
    const priceSlider = this.querySelectorAll("input[type=number]");
    const range = this.querySelector(".slider .progress");
    const dataMaxVal = this.querySelector('.range-input');
    let priceGap = parseFloat(dataMaxVal.dataset.maxpriceValue) < 100 ? 5 : parseFloat(dataMaxVal.dataset.maxpriceValue / 10);

    priceSlider.forEach((input) => {
      input.addEventListener("input", () => {
        let priceMin = parseInt(priceSlider[0].value);
        let priceMax = parseInt(priceSlider[1].value);

        if (priceMax - priceMin >= priceGap && priceMax <= rangeSlider[1].max) {
          if (input.classList.contains("input__min")) {
            rangeSlider[0].value = priceMin;
            range.style.left = (priceMin / rangeSlider[0].max) * 100 + "%";
          } else {
            rangeSlider[1].value = priceMax;
            range.style.right = 100 - (priceMax / rangeSlider[1].max) * 100 + "%";
          }
        }
      });
    });

    rangeSlider.forEach((input) => {
      input.addEventListener("input", () => {
        let slideMin = parseInt(rangeSlider[0].value);
        let slideMax = parseInt(rangeSlider[1].value);

        if (slideMax - slideMin < priceGap) {
          if (input.classList.contains("range__min")) {
            rangeSlider[0].value = slideMax - priceGap;
          } else {
            rangeSlider[1].value = slideMin + priceGap;
          }
        } else {
          priceSlider[0].value = slideMin;
          priceSlider[1].value = slideMax;
          range.style.left = (slideMin / rangeSlider[0].max) * 100 + "%";
          range.style.right = 100 - (slideMax / rangeSlider[1].max) * 100 + "%";
        }
      });
    });
  }
}

customElements.define('price-range', PriceRange);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    const facetLink = this.querySelector('a');
    facetLink.setAttribute('role', 'button');
    facetLink.addEventListener('click', this.closeFilter.bind(this));
    facetLink.addEventListener('keyup', (event) => {
      event.preventDefault();
      if (event.code.toUpperCase() === 'SPACE') this.closeFilter(event);
    });
  }

  closeFilter(event) {
    event.preventDefault();
    const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
    form.onActiveFilterClick(event);
  }
}

customElements.define('facet-remove', FacetRemove);



