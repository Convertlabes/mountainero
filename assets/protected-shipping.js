document.addEventListener('DOMContentLoaded', function () {
    // Check the cart for 'Prio Versand' on page load
    checkPrioVersandInCart();
});

// Add event listener for the toggle
document.getElementById('shipping-product-toggle').addEventListener('change', function (e) {
    const checkbox = e.currentTarget; // Use e.currentTarget to refer to the checkbox
    const productId = checkbox.value; // Get the value of the checkbox (product ID)
    const isChecked = e.target.checked;

    if (isChecked) {
        // Add item to cart
        addToCart(productId);
    } else {
        // Remove item from cart
        removeFromCart(productId); 
    }
});

// Function to check if 'Prio Versand' product is in the cart
function checkPrioVersandInCart() {
    const toggleCheckbox = document.getElementById('shipping-product-toggle');
    
    fetch('/cart.js')
        .then(response => response.json())
        .then(cart => {
            const prioVersandProduct = cart.items.find(item => item.product_title.includes('Prio Versand'));

            if (prioVersandProduct) {
                // If 'Prio Versand' is in the cart, check the toggle
                toggleCheckbox.checked = true;
            } else {
                // Otherwise, uncheck the toggle
                toggleCheckbox.checked = false;
            }
        })
        .catch(error => console.error('Error checking Prio Versand in cart:', error));
}

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

// Function to remove product from cart
function removeFromCart(productId) {
    // Fetch the cart to find the item's line_item ID
    fetch('/cart.js')
        .then(response => response.json())
        .then(cart => {
            if (productId) {
                const formData = {
                    'id': productId, 
                    'quantity': 0 // Setting quantity to 0 will remove the item
                };

                console.log("Attempting to remove item with lineItem.id:", productId); 

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
