if (!customElements.get('custom-option')) {
  customElements.define('custom-option', class CustomOption extends HTMLElement {

      constructor() {
         super();
         this.form = this.querySelector('[id^="ProductOption-"]');
      
         this.dataSelectors = {
            dataType: this.form.dataset.inputType,
            dataID: this.form.dataset.id,
            dataName: this.form.dataset.name,
            dataFormID: this.form.dataset.formId 
         };         
      }

      connectedCallback() {
        const selectedValue = this.getSelectedValue();
        const productForms = document.querySelectorAll(
          `#product-form-${this.dataSelectors.dataFormID}, #product-form-installment-${this.dataSelectors.dataFormID}`
         );  
    
        this.addDynamicInput(selectedValue, productForms);
        this.setInputListeners();
      }

      addDynamicInput(selectedValue, forms) {  
        const input = document.createElement('input');  
        input.className = `from-${this.dataSelectors.dataType}`;  
        input.type = 'hidden';
        input.id = this.dataSelectors.dataID; 
        input.name = this.dataSelectors.dataName;
        if(selectedValue == null) {
          input.value = '';
        } else {
          input.value = selectedValue;
        }
        forms.forEach((productForm) => {
          const container = productForm; 
          container.appendChild(input);
        });    
     }
   
     setInputListeners() {
      const dataType = this.dataSelectors.dataType;
      const optionLegend = this.querySelector('.option-label');
    
      const handleInputChange = (selectedValue) => {
        this.updateFormInput(selectedValue);
        optionLegend.textContent = selectedValue;
      };
    
      const addInputListener = (inputs, eventType, handleChange) => {
        inputs.forEach((input) => {
          input.addEventListener(eventType, handleChange);
        });
      };
    
      if (dataType === 'radio') {
        const radioInputs = this.querySelectorAll('input[type=radio]');
        const handleRadioChange = () => {
          const selectedValue = this.getSelectedRadioValue();
          handleInputChange(selectedValue);
        };
        addInputListener(radioInputs, 'change', handleRadioChange);

      } else if (dataType === 'select') {
        const selectInput = this.querySelector('select');
        const handleSelectChange = () => {
          const selectedValue = this.getSelectedSelectOptionValue();
          handleInputChange(selectedValue);
        };
        selectInput.addEventListener('change', handleSelectChange);

      } else if (dataType === 'checkbox') {
        const checkboxInputs = this.querySelectorAll('input[type=checkbox]');
        const handleCheckboxChange = () => {
          const selectedValue = this.getSelectedCheckboxValue();
          handleInputChange(selectedValue);
        };
        addInputListener(checkboxInputs, 'change', handleCheckboxChange);
      }
    }
   
      updateFormInput(elementValue) {
        const productForms = document.querySelectorAll( 
          `#product-form-${this.dataSelectors.dataFormID}, #product-form-installment-${this.dataSelectors.dataFormID}`
         ); 
        productForms.forEach((productForm) => {
          const input = productForm.querySelector(`#${this.dataSelectors.dataID}`);
          if (input) {
            input.value = elementValue;   
          }
        });
      }
    
      getSelectedRadioValue() {
        if(this.dataSelectors.dataType !== 'radio') return;  
         const selectedInput = this.querySelector('input[type=radio]:checked'); 
         return selectedInput ? selectedInput.value : ''; 
      }  

      getSelectedSelectOptionValue() {
        if(this.dataSelectors.dataType !== 'select') return; 
        const selectOption = this.querySelector('select');  
        return selectOption ? selectOption.value : '';
      }
    
      getSelectedCheckboxValue() {
        if(this.dataSelectors.dataType !== 'checkbox') return; 
        const checkboxInputs = this.querySelectorAll(`input[type=checkbox]`);
        const selectedValues = Array.from(checkboxInputs)
          .filter((checkbox) => checkbox.checked) 
          .map((checkbox) => checkbox.value); 
          let result = null;
          if (selectedValues.length !== 0) {
            result = selectedValues.join(', ');
          }
          return result; 
      }
    
      getSelectedValue() {
        const radioValue = this.getSelectedRadioValue();
        const selectValue = this.getSelectedSelectOptionValue();
        const checkboxValue = this.getSelectedCheckboxValue();
        return checkboxValue || radioValue || selectValue; 
      }
  });
}