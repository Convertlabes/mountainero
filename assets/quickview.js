// Initialize quick view on click
document.querySelectorAll(".quick-view").forEach(function(button) {
  button.addEventListener("click", function(e) {
    e.preventDefault();

    // Display Quick View Loader or Overlay
    showQuickView();

    const productHandle = this.getAttribute('data-handle');
    const productUrl = `/products/${productHandle}`;
    console.log(productUrl, "productUrl");

    // Fetch the product details from the URL
    fetchProductDetails(productUrl);
  });
});

// Function to fetch product details using async/await for cleaner code
async function fetchProductDetails(url) {
  try {
    // Show loading state (optional)
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch product details. Status: ${response.status}`);
    }

    // Parse the response text into HTML document
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Update the quick view with fetched content
    updateQuickView(doc);
    fetchImageOfProduct(doc);
  } catch (error) {
    console.error('There was a problem fetching the product page:', error);
    showErrorMessage('Failed to load product details. Please try again.');
  }
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

  // Clear any existing content in mediaGallery
  mediaGallery.innerHTML = '';

  // Remove attributes from imgContainer children to prevent layout issues
  Array.from(imgContainer.children).forEach(child => {
      child.removeAttribute('width');
      child.removeAttribute('height');
      child.removeAttribute('sizes');
  });

  // Create a new price title div and append necessary elements
  const newDiv = document.createElement('div');
  newDiv.className = 'priceTitle';
  if (imageVacancy) newDiv.appendChild(imageVacancy);
  if (originPrice) newDiv.appendChild(originPrice);
  
  mediaGallery.appendChild(imgContainer);
  mediaGallery.appendChild(newDiv);

  const productContent = doc.querySelector('.pdp');
  if (productContent) {
      quickViewElement.innerHTML = productContent.innerHTML;
      setupColorSwatchEventListeners();
  } else {
      console.warn('Product content not found');
  }
  
  document.getElementById('buy_btn').addEventListener('click', function (){
    setTimeout(() => {
      hideQuickView();
    }, 2000);
  });
}

// Function to setup event listeners for color swatches
function setupColorSwatchEventListeners() {
  const links = document.querySelectorAll('a.color-swatch');
  
  links.forEach(link => {
      link.addEventListener('click', function(event) {
          event.preventDefault();  // Prevent the default behavior
          const linkHref = this.getAttribute('href');
          console.log(linkHref, "=> linkHref");

          fetchProductDetails(linkHref);  // Fetch the details for the new product
      });
      console.log("Event listener added to the anchor tag");
  });
}

// Function to handle showing the quick view
function showQuickView() {
  var quickView = document.getElementById('pre-rendered-quick-view');
  var overlay = document.getElementById('quickViewOverlay');

  if (quickView && overlay) {
      quickView.classList.add('show');  // Add class to show quick view
      overlay.classList.add('show');    // Add class to show overlay
  } else {
      console.error('Quick View or Overlay not found.');
  }
}

// Function to hide the quick view
function hideQuickView() {
  var quickView = document.getElementById('pre-rendered-quick-view');
  var overlay = document.getElementById('quickViewOverlay');

  if (quickView && overlay) {
      quickView.classList.remove('show');  // Remove class to hide quick view
      overlay.classList.remove('show');    // Remove class to hide overlay
  } else {
      console.error('Quick View or Overlay not found.');
  }
}

// Function to fetch and update the product image when a color swatch is clicked
function fetchImageOfProduct(doc) {
  const links = doc.querySelectorAll('[data-image]'); // Look for elements with data-image attribute

  if (links.length === 0) {
    console.warn("No elements found with [data-image] selector.");
    return;
  }

  links.forEach(link => {
    link.addEventListener('click', function(event) {
      alert("pong");
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

// Hide Quick View when overlay is clicked
document.getElementById('quickViewOverlay').addEventListener('click', hideQuickView);

// Hide Quick View when cart drawer overlay is clicked
document.querySelector('.cart-drawer__overlay').addEventListener('click', hideQuickView);

// Function to display error message
function showErrorMessage(message) {
  const errorContainer = document.getElementById('quick-view-error');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
  }
}
