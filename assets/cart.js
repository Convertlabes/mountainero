class CartRemoveButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', (event) => {
      event.preventDefault();
      const cartItems = this.closest('cart-items') || this.closest('cart-drawer-items');
      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();

    this.lineItemStatusElement = document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');

    this.currentItemCount = Array.from(this.querySelectorAll('[name="updates[]"]'))
      .reduce((total, quantityInput) => total + parseInt(quantityInput.value), 0);

    this.debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);

    this.addEventListener('change', this.debouncedOnChange.bind(this));
  }

  onChange(event) {
    this.updateQuantity(event.target.dataset.index, event.target.value, document.activeElement.getAttribute('name'));
  }

  getSectionsToRender() {
    return [
      {
        id: 'main-cart-items',
        section: document.getElementById('main-cart-items').dataset.id,
        selector: '.js-contents',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section'
      },
      {
        id: 'cart-live-region-text',
        section: 'cart-live-region-text',
        selector: '.shopify-section'
      },
      {
        id: 'main-cart-footer',
        section: document.getElementById('main-cart-footer').dataset.id,
        selector: '.js-contents',
      }
    ];
  }

  // updateQuantity(line, quantity, name) {
  //   this.enableLoading(line);

  //   const body = JSON.stringify({
  //     line,
  //     quantity,
  //     sections: this.getSectionsToRender().map((section) => section.section),
  //     sections_url: window.location.pathname
  //   });

  //   fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
  //     .then((response) => {
  //       return response.text();
  //     })
  //     .then((state) => {
  //       const parsedState = JSON.parse(state);
  //       this.classList.toggle('is-empty', parsedState.item_count === 0);
  //       const cartDrawerWrapper = document.querySelector('cart-drawer');
  //       const cartFooter = document.getElementById('main-cart-footer');

  //       if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
  //       if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);

  //       this.getSectionsToRender().forEach((section => {
  //         const elementToReplace =
  //           document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
  //         elementToReplace.innerHTML =
  //           this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
  //       }));

  //       this.updateLiveRegions(line, parsedState.item_count);
  //       const lineItem = document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
  //       if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
  //         cartDrawerWrapper ? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`)) : lineItem.querySelector(`[name="${name}"]`).focus();
  //       } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
  //         trapFocus(cartDrawerWrapper.querySelector('.drawer__inner-empty'), cartDrawerWrapper.querySelector('a'))
  //       } else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
  //         trapFocus(cartDrawerWrapper, document.querySelector('.cart-item__name'))
  //       }
  //       this.disableLoading();
  //     }).catch(() => {
  //       this.querySelectorAll('.loading-overlay').forEach((overlay) => overlay.classList.add('hidden'));
  //       const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
  //       errors.textContent = window.cartStrings.error;
  //       this.disableLoading();
  //     });
  // }

  updateQuantity(line, quantity, name) {
    this.enableLoading(line);
  
    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname
    });
  
    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), body })
      .then(response => {
        if (!response.ok) {
          // If response is not OK (status 4xx or 5xx), throw an error with the status
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();  // Attempt to parse response as JSON
      })
      .then(parsedState => {
        updateCartState(parsedState, line, name);  // Update UI after state changes
        this.disableLoading();
        setTimeout(() => {
          initializeSwiper();
          protectedShipping(); 
          manageQuickView();
          fetchImageOfProduct();
        }, 200);  // Delay to ensure content is fully loaded
      })
      .catch((error) => {
        console.error('Cart update error:', error);  // Log the error for debugging
        handleError();
      });
  
    // Function to update the cart state, progress bar, and UI
    const updateCartState = (parsedState, line, name) => {
      const cartDrawerWrapper = document.querySelector('cart-drawer');
      const cartFooter = document.getElementById('main-cart-footer');
  
      toggleEmptyState(parsedState.item_count, cartDrawerWrapper, cartFooter);
      
      updateSections(parsedState);
      updateFocus(line, name, parsedState, cartDrawerWrapper);
  
      updateCartProgress(parsedState.total_price); // Refactored progress bar logic
    };
  
    // Toggles empty state for cart UI
    const toggleEmptyState = (itemCount, cartDrawerWrapper, cartFooter) => {
      const isEmpty = itemCount === 0;
      this.classList.toggle('is-empty', isEmpty);
  
      if (cartFooter) cartFooter.classList.toggle('is-empty', isEmpty);
      if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', isEmpty);
    };
  
    // Updates sections based on cart state
    const updateSections = (parsedState) => {
      this.getSectionsToRender().forEach(section => {
        const elementToReplace = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
        elementToReplace.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
      });
    };
  
    // Updates focus on cart drawer
    const updateFocus = (line, name, parsedState, cartDrawerWrapper) => {
      const lineItem = document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
      const focusElement = lineItem?.querySelector(`[name="${name}"]`);
  
      if (focusElement) {
        cartDrawerWrapper ? trapFocus(cartDrawerWrapper, focusElement) : focusElement.focus();
      } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
        trapFocus(cartDrawerWrapper.querySelector('.drawer__inner-empty'), cartDrawerWrapper.querySelector('a'));
      } else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
        trapFocus(cartDrawerWrapper, document.querySelector('.cart-item__name'));
      }
    };
  
    // Updates the progress bar based on the cart total
    const updateCartProgress = (totalPrice) => {
      const freeShippingValueHTML = document.querySelector('.free-shipping-value');
      const shoppingGoal = parseFloat(freeShippingValueHTML.innerHTML.replace(/[^0-9.-]+/g, ''));
      const percentage = Math.min((totalPrice / shoppingGoal) * 100, 100);
  
      const progressArc = document.getElementById('progress-arc');
      const progressText = document.getElementById('progress-text');
      const bannerColor = document.querySelector('.fillColor');
      const progressBarText = document.querySelector('.secrow');
      const radius = 18.5; // Circle radius for SVG
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (percentage / 100 * circumference);
  
      progressArc.setAttribute('stroke-dasharray', `${circumference} ${circumference}`);
      progressArc.setAttribute('stroke-dashoffset', offset);
  
      if (percentage >= 100) {
        showCompletion(progressText, bannerColor, progressBarText);
      } else {
        updateProgressText(progressText, percentage, bannerColor);
      }
    };
  
    // Shows progress completion when 100% reached
    const showCompletion = (progressText, bannerColor, progressBarText) => {
      progressText.outerHTML = `
        <svg id="progress-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M4.5 12.75L10.5 18.75L19.5 5.25" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      progressBarText.innerHTML = "Kostenloser Versand freigeschaltet!";
      progressBarText.style.display = "flex";
      progressBarText.style.alignItems = "center";
      const progressSvg = document.getElementById('progress-svg');
      progressSvg.style.top = '14px';
      progressSvg.style.left = '4px';
  
      bannerColor.style.backgroundColor = '#8D9677';
    };

    function fetchImageOfProduct(doc) {
      const links = doc.querySelectorAll('#defaultColorOption');
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
  
    // Updates progress bar text and reset color
    const updateProgressText = (progressText, percentage, bannerColor) => {
      progressText.textContent = `${Math.round(percentage)}%`;
      bannerColor.style.backgroundColor = '#000000'; // Default color
    };
  
    // Handles errors during fetch
    const handleError = () => {
      this.querySelectorAll('.loading-overlay').forEach(overlay => overlay.classList.add('hidden'));
      const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
      errors.textContent = window.cartStrings.error || 'An error occurred while updating your cart.';
      this.disableLoading();
    };
  
    // Initialize Swiper for cart drawer
    const initializeSwiper = () => {
      const swiper = new Swiper('.drawer .swiper-container', {
        slidesPerView: 1,  // Number of slides to show
        spaceBetween: 12,     // Space between slides
        loop: false,           // Enable looping
        centeredSlides: true, // Center slides in view
        navigation: false,    // Disable navigation arrows
        pagination: false,    // Disable pagination
        draggable: true,      // Enable dragging/swiping
        freeMode: true        // Allows free scrolling in swiper
      });
    };

    const protectedShipping = () => {
      document.getElementById('shipping-product-toggle').addEventListener('change', function (e) {
        const checkbox = e.currentTarget; // Use e.currentTarget to refer to the checkbox
        const productId = checkbox.value; // Get the value of the checkbox (product ID)
    
        const isChecked = e.target.checked;
    
        if (isChecked) {
            // Add item to cart
            addToCart(productId);
        } else {
            // Remove item from cart
            removeFromCart(productId); // Use lineItemIndex to remove the correct item
        }
    });
    
    // Function to add product to cart
    function addToCart(productId) {
        const formData = {
            'id': productId,
            'quantity': 1
        };
    
        fetch('/cart/add.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
            .then(response => response.json())
            .then(data => {
                console.log("Product added:", data);
                updateCartTotal(); // Call to update the total price
            })
            .catch(error => {
                console.error('Error adding product to cart:', error);
            });
    }
    
    function removeFromCart(productId) {
        // Fetch the cart to find the item's line_item ID
        fetch('/cart.js')
            .then(response => response.json())
            .then(cart => {
                if (productId) {
                    const formData = {
                        'id': productId, // Use lineItem.id
                        'quantity': 0 // Setting quantity to 0 will remove the item
                    };
    
                    console.log("Attempting to remove item with lineItem.id:", productId); // Log the line item ID
    
                    // Use the change.js endpoint to modify the cart
                    fetch('/cart/change.js', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData),
                    })
                        .then(response => {
                            if (!response.ok) {
                                return response.json().then(err => {
                                    throw new Error(JSON.stringify(err));
                                });
                            }
                            return response.json();
                        })
                        .then(data => {
                            console.log("Product removed:", data);
                            updateCartTotal(); // Update total price after removal
                        })
                        .catch(error => {
                            console.error('Error removing product from cart:', error);
                        });
                } else {
                    console.log('Product not found in cart.');
                }
            })
            .catch(error => console.error('Error fetching cart:', error));
    }
    
    // Function to update the total price in the cart
    function updateCartTotal() {
        fetch('/cart.js')
            .then(response => response.json())
            .then(cart => {
                const totalPrice = cart.total_price / 100; // Shopify returns the price in cents, so divide by 100
                document.querySelector('.totals__subtotal-value').textContent = `$${totalPrice.toFixed(2)}`;
            })
            .catch(error => {
                console.error('Error fetching cart total:', error);
            });
    }
    
    }

    function manageQuickView() {
      // Initialize quick view click event
      document.querySelectorAll(".quick-view").forEach(function(button) {
          button.addEventListener("click", function(e) {
              e.preventDefault();
              const product_handle = this.getAttribute('data-handle');
              const productUrl = `/products/${product_handle}`;
              console.log(productUrl, "productUrl");
  
              showQuickView();  // Display the quick view overlay
              fetchProductDetails(productUrl);  // Fetch product details
          });
      });
  
      // Function to fetch product details
      function fetchProductDetails(url) {
          fetch(url)
              .then(response => {
                  if (!response.ok) {
                      throw new Error('Network response was not ok');
                  }
                  return response.text();
              })
              .then(html => {
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');
  
                  // Update the quick view
                  updateQuickView(doc);
                  fetchImageOfProduct(doc)
              })
              .catch(error => {
                  console.error('There was a problem fetching the product page:', error);
              });
      }
  
      // Function to update the quick view
      function updateQuickView(doc) {
          const quickViewElement = document.querySelector('#quick-view');
          const mediaGallery = doc.querySelector('.product__media-wrapper');
          const imgContainer = doc.querySelector('.custom-img');
          const originPrice = doc.querySelector('.price-item--regular');
          const imageVacancy = doc.querySelector('.product__title');
          
          if (!quickViewElement || !mediaGallery || !imgContainer) {
              console.warn('Required elements for quick view not found');
              return;
          }
  
          // Remove attributes from imgContainer children
          Array.from(imgContainer.children).forEach(child => {
              child.removeAttribute('width');
              child.removeAttribute('height');
              child.removeAttribute('sizes');
          });
  
          // Create a new price title div and append necessary elements
          const newDiv = document.createElement('div');
          newDiv.className = 'priceTitle';
          newDiv.appendChild(imageVacancy);
          newDiv.appendChild(originPrice);
          
          mediaGallery.appendChild(imgContainer);
          mediaGallery.appendChild(newDiv);
  
          const productContent = doc.querySelector('.pdp');
          if (productContent) {
              quickViewElement.innerHTML = productContent.innerHTML;
              setupColorSwatchEventListeners();
          } else {
              console.warn('Product content not found');
          }
      }
  
      // Function to setup event listeners for color swatches
      function setupColorSwatchEventListeners() {
          const links = document.querySelectorAll('a.color-swatch');
          
          links.forEach(link => {
              link.addEventListener('click', function(event) {
                  event.preventDefault();  // Prevent default behavior
                  const linkHref = this.getAttribute('href');
                  console.log(linkHref, "=> linkHref");
                  console.log("Custom function is running, but no redirect!");
  
                  fetchProductDetails(linkHref);  // Fetch the details for the new product
              });
              console.log("Event listener added to the anchor tag");
          });
      }
  
      // Overlay click event to hide quick view
      document.getElementById('quickViewOverlay').addEventListener('click', hideQuickView);
      document.querySelector('.cart-drawer__overlay').addEventListener('click', hideQuickView);
  
      // Function to show quick view
      function showQuickView() {
          var quickView = document.getElementById('pre-rendered-quick-view');
          var overlay = document.getElementById('quickViewOverlay');
  
          if (quickView && overlay) {
              quickView.classList.add('show');  // Show quick view
              overlay.classList.add('show');    // Show overlay
          } else {
              console.error('Quick View or Overlay not found.');
          }
      }
  
      // Function to hide the quick view
      function hideQuickView() {
          var quickView = document.getElementById('pre-rendered-quick-view');
          var overlay = document.getElementById('quickViewOverlay');
  
          if (quickView && overlay) {
              quickView.classList.remove('show');  // Hide quick view
              overlay.classList.remove('show');    // Hide overlay
          } else {
              console.error('Quick View or Overlay not found.');
          }
      }
    }
  }
  

  
  updateLiveRegions(line, itemCount) {
    if (this.currentItemCount === itemCount) {
      const lineItemError = document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
      const quantityElement = document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
      lineItemError
        .querySelector('.cart-item__error-text')
        .innerHTML = window.cartStrings.quantityError.replace(
          '[quantity]',
          quantityElement.value
        );
    }

    this.currentItemCount = itemCount;
    this.lineItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus = document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
    cartStatus.setAttribute('aria-hidden', false);

    setTimeout(() => {
      cartStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.add('cart__items--disabled');

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading-overlay`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading-overlay`);

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove('hidden'));

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute('aria-hidden', false);
  }

  disableLoading() {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.remove('cart__items--disabled');
  }
}

customElements.define('cart-items', CartItems);

if (!customElements.get('cart-note')) {
  customElements.define('cart-note', class CartNote extends HTMLElement {
    constructor() {
      super();

      this.addEventListener('change', debounce((event) => {
        const body = JSON.stringify({ note: event.target.value });
        fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } });
      }, 300))
    }
  });
};
