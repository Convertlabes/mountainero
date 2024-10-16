if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();

      this.form = this.querySelector('form');
      this.form.querySelector('[name=id]').disabled = false;
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
      this.submitButton = this.querySelector('[type="submit"]');
      if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');
    }
    
    onSubmitHandler(evt) {

      evt.preventDefault();
      if (this.submitButton.getAttribute('aria-disabled') === 'true') return;
      const freeShippingValueHTML = document.getElementById('freeShipping');
      const shoppingGoal = parseFloat(freeShippingValueHTML.innerHTML.replace(/[^0-9.-]+/g, ''));
      
      this.handleErrorMessage();

      this.submitButton.setAttribute('aria-disabled', true);
      this.submitButton.classList.add('loading');
      this.querySelector('.loading-overlay__spinner').classList.remove('hidden');

      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];

      const formData = new FormData(this.form);

      if (this.cart) {
        console.log(this.cart,"=>this.cart is here!!!")
        formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id));
        formData.append('sections_url', window.location.pathname);
        this.cart.setActiveElement(document.activeElement);
      }
      config.body = formData;

      fetch(`${routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            this.handleErrorMessage(response.description);

            const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
            if (!soldOutMessage) return;
            this.submitButton.setAttribute('aria-disabled', true);
            this.submitButton.querySelector('span').classList.add('hidden');
            soldOutMessage.classList.remove('hidden');
            this.error = true;
            return;
          } else if (!this.cart) {
            window.location = window.routes.cart_url;
            return;
          }

          this.error = false;
          const quickAddModal = this.closest('quick-add-modal');
          if (quickAddModal) {
            document.body.addEventListener('modalClosed', () => {
              setTimeout(() => { this.cart.renderContents(response) });
            }, { once: true });
            quickAddModal.hide(true);
          } else {
            this.cart.renderContents(response);
          }
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          this.submitButton.classList.remove('loading');
          if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
          if (!this.error) this.submitButton.removeAttribute('aria-disabled');
          this.querySelector('.loading-overlay__spinner').classList.add('hidden');
        });


        setTimeout(() => {
          fetch('/cart.js')
          .then(response => {
            console.log('Response from /cart.js:', response); // Log the response
            if (!response.ok) {
              throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
          })
          .then(data => {
            console.log('Data from /cart.js:', data); // Log the JSON data
            const totalPrice = data.total_price; // Total price in cents
            updateProgressBar(totalPrice); // Update the progress bar
            protectedShipping();
            initializeSwiper();
            fetchImageOfProduct();
          })
          .catch(error => {
            console.error('Error fetching cart total:', error);
          });

          function fetchImageOfProduct() {
            const links = document.querySelectorAll('#defaultColorOption');
            console.log(links, "links for color swatches");
          
            links.forEach(link => {
              link.addEventListener('click', function(event) {
                event.preventDefault();
                const imageUrl = this.getAttribute("data-image");
                console.log(imageUrl, "=> Image URL");
          
                const imgContainer = document.querySelector('.custom-img');
                if (imgContainer) {
                  const imageElement = imgContainer.querySelector('img');
                  if (imageElement) {
                    imageElement.src = imageUrl;
                  } else {
                    console.error("Image element not found inside '.custom-img' container.");
                  }
                } else {
                  console.error("Image container '.custom-img' not found.");
                }
              });
            });
          }
        
          function updateProgressBar(totalPrice) {
            const percentage = Math.min((totalPrice / shoppingGoal) * 100, 100); // Calculate percentage
            console.log('Percentage:', percentage);
          
            const progressArc = document.getElementById('progress-arc');
            const progressText = document.getElementById('progress-text');
            const bannerColor = document.querySelector('.fillColor');
            const radius = 18.5; // Circle radius (matches SVG r="18.5")
            const circumference = 2 * Math.PI * radius; // Calculate circumference (~116.23)
            const offset = circumference - (percentage / 100 * circumference);
            const progressBarText = document.querySelector('.secrow');
            console.log('Circumference:', circumference);
            console.log('Stroke Dash Offset:', offset);
            
            // Apply the calculated stroke-dasharray and stroke-dashoffset
            progressArc.setAttribute('stroke-dasharray', `${circumference} ${circumference}`);
            progressArc.setAttribute('stroke-dashoffset', offset); // Ensure this reduces to zero at 100%
          
            if (percentage >= 100) {
              // Change the text to the checkmark SVG when 100% is reached
              progressText.outerHTML = `
              <svg id = "progress-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4.5 12.75L10.5 18.75L19.5 5.25" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              `;
              progressBarText.innerHTML = "Kostenloser Versand freigeschaltet!";
              progressBarText.style.display = "flex";
              progressBarText.style.alignItems = "center";
              const progressSvg = document.getElementById('progress-svg');
              progressSvg.style.top = '14px';
              progressSvg.style.left = '4px';
              // Change the progress background to the specified green color
              bannerColor.style.backgroundColor = '#8D9677';
              console.log(bannerColor.style.backgroundColor, "bannerColor");
            } else {
              // Update the percentage text
              progressText.textContent = `${Math.round(percentage)}%`;
          
              // Reset progress arc stroke to default color if not 100%
              bannerColor.style.backgroundColor = '#000000'; // Default color
            }
          }
        }, 1000);
                // Fixed initializeSwiper method
     function initializeSwiper() {
      if (typeof Swiper !== 'undefined') {
        const swiper = new Swiper('.drawer .swiper-container', {
          slidesPerView: 1,  // Number of slides to show
          spaceBetween: 12,  // Space between slides
          loop: false,       // Disable looping
          centeredSlides: true, // Center slides in view
          navigation: false, // Disable navigation arrows
          pagination: false, // Disable pagination
          draggable: true,   // Enable dragging/swiping
          freeMode: true     // Allows free scrolling in swiper
        });
      } else {
        console.error("Swiper is not defined. Ensure Swiper library is loaded.");
      }
    }

    // Fixed protectedShipping method
    function protectedShipping() {
      const shippingProductToggle = document.getElementById('shipping-product-toggle');
      const shippingProtectionMoneyElement = document.querySelector('.shipping-protection-money');
      const cartTotalElement = document.querySelector('.totals__subtotal-value'); 

      // Ensure required elements are found
      if (!shippingProductToggle || !shippingProtectionMoneyElement || !cartTotalElement) {
        console.error("Required elements not found. Check the IDs/classes in the HTML.");
        return;
      }

      // Convert cart total and shipping protection to numbers
      const shippingMoney = parseFloat(shippingProtectionMoneyElement.innerHTML.replace(/[^0-9.-]+/g, '')); 
      let cartTotalNumber = parseFloat(cartTotalElement.innerHTML.replace(/[^0-9.-]+/g, '')); 

      // Function to update the cart total
      function updateCartTotal(add) {
        if (add) {
          cartTotalNumber += shippingMoney; // Adding shipping product price
        } else {
          cartTotalNumber -= shippingMoney; // Subtracting shipping product price
        }

        // Format and update the cart total element
        cartTotalElement.innerHTML = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cartTotalNumber / 100);
        console.log("Updated Cart Total: ", cartTotalNumber);
      }

      // Initial check if toggle is checked
      if (shippingProductToggle.checked) {
        updateCartTotal(true);
      }

      // Event listener for the toggle
      shippingProductToggle.addEventListener('change', function() {
        updateCartTotal(this.checked);
      });
    }
    }



     handleErrorMessage(errorMessage = false) {
      this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
      if (!this.errorMessageWrapper) return;
      this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

      this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

      if (errorMessage) {
        this.errorMessage.textContent = errorMessage;
      }
    }
  });
}
