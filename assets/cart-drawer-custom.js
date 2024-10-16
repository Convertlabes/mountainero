const freeShippingValueHTML = document.querySelector('.free-shipping-value');

const shoppingGoal = parseFloat(freeShippingValueHTML.innerHTML.replace(/[^0-9.-]+/g, ''));

function getCartTotal() {
  console.log('Fetching cart total...');
  fetch('/cart.js')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      const totalPrice = data.total_price; // Total price in cents
      console.log('Total Price:', totalPrice);

      updateProgressBar(totalPrice); // Update the progress bar
    })
    .catch(error => {
      console.error('Error fetching cart total:', error);
    });
}

function updateProgressBar(totalPrice) {
  const percentage = Math.min((totalPrice / shoppingGoal) * 100, 100); // Calculate percentage
  console.log('Percentage:', percentage);

  const progressArc = document.getElementById('progress-arc');
  const progressText = document.getElementById('progress-text');
  const bannerColor = document.querySelector('.fillColor');
  const progressBarText = document.querySelector('.secrow');
  const radius = 18.5; // Circle radius (matches SVG r="18.5")
  const circumference = 2 * Math.PI * radius; // Calculate circumference (~116.23)
  const offset = circumference - (percentage / 100 * circumference);
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
    progressBarText.innerHTML  = "Kostenloser Versand freigeschaltet!";
    progressBarText.style.display = "flex";
    progressBarText.style.alignItems = "center";
    const progressSvg = document.getElementById('progress-svg');
    progressSvg.style.top = '13px';
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

getCartTotal();

// document.addEventListener('DOMContentLoaded', function() {
//   var shippingProductToggle = document.getElementById('shipping-product-toggle');
//   var shippingProtectionMoney = document.querySelector('.shipping-protection-money').innerHTML;

//   // Ensure cartTotalElement is not null before trying to use it
//   var cartTotalElement = document.querySelector('.totals__subtotal-value'); 
//   if (!cartTotalElement) {
//       console.error("Cart total element not found");
//       return;
//   }
  
//   // Convert cart total and shipping protection to numbers
//   var cartTotalNumber = parseFloat(cartTotalElement.innerHTML.replace(/[^0-9.-]+/g, '')); // Get initial cart total
//   var shippingMoney = parseFloat(shippingProtectionMoney.replace(/[^0-9.-]+/g, '')); // Get shipping protection price

//   // Function to update the cart total
//   function updateCartTotal(add) {
//       if (add) {
//           cartTotalNumber += shippingMoney; // Adding shipping product price
//       } else {
//           cartTotalNumber -= shippingMoney; // Subtracting shipping product price
//       }

//       // Format the updated total and update the cart total element
//       cartTotalElement.innerHTML = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cartTotalNumber / 100);
//       console.log("Updated Cart Total: ", cartTotalNumber); // Check the updated value
//   }

//   // Initial check - if checked, shipping price is added
//   if (shippingProductToggle) {
//       // Update total if the toggle is initially checked
//       if (shippingProductToggle.checked) {
//           updateCartTotal(true);
//       }

//       // Toggle event listener
//       shippingProductToggle.addEventListener('change', function() {
//           updateCartTotal(this.checked); // Use the checked status directly
//       });
//   } else {
//       console.error("Shipping product toggle not found");
//   }
// });
