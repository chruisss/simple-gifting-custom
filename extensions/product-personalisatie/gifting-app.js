/**
 * Simple Gifting App - Shared JavaScript Utilities
 * This file contains shared functions and utilities for the gifting app
 */

window.SimpleGifting = window.SimpleGifting || {};

// Utility functions
SimpleGifting.utils = {
  /**
   * Format money based on Shopify's money format
   * @param {number} cents - Price in cents
   * @param {string} format - Money format (optional)
   * @returns {string} Formatted price
   */
  formatMoney: function(cents, format) {
    if (typeof cents !== 'number') {
      return '€0,00';
    }
    
    const money = (cents / 100).toFixed(2);
    
    // Use Shopify's money format if available
    if (window.Shopify && window.Shopify.formatMoney) {
      return window.Shopify.formatMoney(cents, format);
    }
    
    // Default format for European stores
    return `€${money.replace('.', ',')}`;
  },

  /**
   * Debounce function to limit API calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce: function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Check if an element is in viewport
   * @param {Element} element - Element to check
   * @returns {boolean} Whether element is in viewport
   */
  isInViewport: function(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Get URL parameters
   * @param {string} name - Parameter name
   * @returns {string|null} Parameter value
   */
  getUrlParameter: function(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  },

  /**
   * Create a loading spinner element
   * @returns {Element} Spinner element
   */
  createSpinner: function() {
    const spinner = document.createElement('div');
    spinner.className = 'gifting-btn-loading';
    return spinner;
  },

  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean} Whether email is valid
   */
  validateEmail: function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Sanitize HTML to prevent XSS
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeHtml: function(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  },

  /**
   * Get product data from Shopify
   * @param {string} handle - Product handle
   * @returns {Promise<Object>} Product data
   */
  fetchProduct: async function(handle) {
    try {
      const response = await fetch(`/products/${handle}.js`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  /**
   * Add item to cart
   * @param {Object} formData - Cart form data
   * @returns {Promise<Object>} Cart response
   */
  addToCart: async function(formData) {
    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.description || data.message || 'Failed to add to cart');
      }

      return data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  /**
   * Get cart data
   * @returns {Promise<Object>} Cart data
   */
  getCart: async function() {
    try {
      const response = await fetch('/cart.js');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  },

  /**
   * Show toast notification
   * @param {string} message - Message to show
   * @param {string} type - Type of toast (success, error, info)
   * @param {number} duration - Duration in milliseconds
   */
  showToast: function(message, type = 'success', duration = 3000) {
    // Remove existing toasts
    document.querySelectorAll('.gifting-toast').forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `gifting-toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

    // Remove toast after duration
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, duration);
  },

  /**
   * Create modal HTML template
   * @param {string} blockId - Block ID for unique identification
   * @param {Object} settings - Block settings
   * @returns {string} Modal HTML
   */
  createModalTemplate: function(blockId, settings) {
    const quantitySection = settings.enable_quantity_selector ? `
      <div id="gifting-quantity-section" class="gifting-quantity-section" style="display: none;">
        <h3 class="gifting-section-title">Aantal</h3>
        <div class="gifting-quantity-controls">
          <button id="quantity-decrease" class="gifting-quantity-button" aria-label="Aantal verminderen">-</button>
          <input type="number" id="gifting-quantity" class="gifting-quantity-input" value="1" min="1" max="${settings.max_quantity || 10}" aria-label="Aantal">
          <button id="quantity-increase" class="gifting-quantity-button" aria-label="Aantal verhogen">+</button>
        </div>
      </div>
    ` : '';

    const carouselHTML = settings.use_carousel ? `
      <div class="gifting-carousel-container">
        <div id="gifting-product-list" class="gifting-product-carousel"></div>
        <div class="gifting-carousel-controls">
          <button id="carousel-prev" class="gifting-carousel-button" aria-label="Vorige producten">‹</button>
          <div id="carousel-dots" class="gifting-carousel-dots"></div>
          <button id="carousel-next" class="gifting-carousel-button" aria-label="Volgende producten">›</button>
        </div>
      </div>
    ` : `
      <div id="gifting-product-list" class="gifting-product-grid"></div>
    `;

    return `
      <div class="gifting-modal-backdrop">
        <div class="gifting-modal" role="dialog" aria-labelledby="gifting-modal-title-${blockId}" aria-modal="true">
          <div class="gifting-modal-header">
            <h2 id="gifting-modal-title-${blockId}" class="gifting-modal-title">
              ${this.sanitizeHtml(settings.modal_title || 'Voeg een persoonlijk bericht toe')}
            </h2>
            <p class="gifting-modal-subtitle">
              ${this.sanitizeHtml(settings.modal_subtitle || 'Maak het extra speciaal')}
            </p>
            <button class="gifting-modal-close" aria-label="Modal sluiten">&times;</button>
          </div>
          <div class="gifting-modal-body">
            <div class="gifting-product-section">
              <h3 class="gifting-section-title">Kies een product</h3>
              ${carouselHTML}
            </div>
            
            <div id="gifting-variant-section" class="gifting-variant-section" style="display: none;">
              <h3 class="gifting-section-title">Kies een optie</h3>
              <div id="gifting-variant-options" class="gifting-variant-options"></div>
            </div>
            
            ${quantitySection}
            
            <div id="gifting-message-section" class="gifting-message-section" style="display: none;">
              <h3 class="gifting-section-title">Persoonlijk bericht</h3>
              <textarea 
                id="gifting-message" 
                class="gifting-message-textarea" 
                placeholder="Voeg hier je persoonlijke boodschap toe..."
                maxlength="${settings.max_chars || 250}"
                aria-label="Persoonlijk bericht"
              ></textarea>
              <div id="gifting-char-count" class="gifting-char-count" style="display: none;" aria-live="polite"></div>
            </div>
            
            <button id="gifting-add-to-cart" class="gifting-add-to-cart" disabled aria-describedby="gifting-modal-title-${blockId}">
              <span class="gifting-btn-loading" aria-hidden="true"></span>
              <span class="gifting-btn-text">${this.sanitizeHtml(settings.select_product_text || 'Selecteer product')}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Initialize event listeners for accessibility
   */
  initAccessibility: function() {
    // Handle escape key to close modals
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.gifting-modal-backdrop[style*="flex"]');
        if (openModal) {
          const trigger = document.querySelector('input[type="checkbox"][id*="gifting-modal-trigger"]:checked');
          if (trigger) {
            trigger.checked = false;
            trigger.dispatchEvent(new Event('change'));
          }
        }
      }
    });

    // Trap focus within modal
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        const openModal = document.querySelector('.gifting-modal-backdrop[style*="flex"]');
        if (openModal) {
          const focusableElements = openModal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    });
  },

  /**
   * Initialize performance monitoring
   */
  initPerformanceMonitoring: function() {
    // Monitor load times
    if (window.performance && window.performance.mark) {
      window.performance.mark('simple-gifting-start');
      
      window.addEventListener('load', function() {
        window.performance.mark('simple-gifting-end');
        window.performance.measure('simple-gifting-load', 'simple-gifting-start', 'simple-gifting-end');
        
        const measure = window.performance.getEntriesByName('simple-gifting-load')[0];
        if (measure && measure.duration > 1000) {
          console.warn('Simple Gifting: Slow load time detected:', measure.duration + 'ms');
        }
      });
    }
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    SimpleGifting.utils.initAccessibility();
    SimpleGifting.utils.initPerformanceMonitoring();
  });
} else {
  SimpleGifting.utils.initAccessibility();
  SimpleGifting.utils.initPerformanceMonitoring();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SimpleGifting;
}
