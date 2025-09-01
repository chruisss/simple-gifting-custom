import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

/**
 * Theme injection service
 * Automatically injects Simple Gifting code into the active theme
 */

interface ThemeFile {
  key: string;
  value: string;
}

interface ThemeAsset {
  key: string;
  value?: string;
  attachment?: string;
}

export async function injectThemeCode(admin: any, themeId: string) {
  try {
    const results: {
      success: boolean;
      injected: string[];
      errors: string[];
      alreadyExists: string[];
    } = {
      success: false,
      injected: [],
      errors: [],
      alreadyExists: []
    };

    // 1. Check if theme extension files already exist
    const existingAssets = await getThemeAssets(admin, themeId);
    
    // 2. Inject liquid snippet for product pages
    const snippetResult = await injectProductSnippet(admin, themeId, existingAssets);
    if (snippetResult.success) {
      results.injected.push('product-gifting-snippet');
    } else if (snippetResult.alreadyExists) {
      results.alreadyExists.push('product-gifting-snippet');
    } else {
      if (snippetResult.error) {
        results.errors.push(snippetResult.error);
      }
    }

    // 3. Inject CSS styles
    const cssResult = await injectGiftingStyles(admin, themeId, existingAssets);
    if (cssResult.success) {
      results.injected.push('gifting-styles');
    } else if (cssResult.alreadyExists) {
      results.alreadyExists.push('gifting-styles');
    } else {
      if (cssResult.error) {
        results.errors.push(cssResult.error);
      }
    }

    // 4. Inject JavaScript
    const jsResult = await injectGiftingScript(admin, themeId, existingAssets);
    if (jsResult.success) {
      results.injected.push('gifting-script');
    } else if (jsResult.alreadyExists) {
      results.alreadyExists.push('gifting-script');
    } else {
      if (jsResult.error) {
        results.errors.push(jsResult.error);
      }
    }

    // 5. Update product template
    const templateResult = await updateProductTemplate(admin, themeId);
    if (templateResult.success) {
      results.injected.push('product-template');
    } else if (templateResult.alreadyExists) {
      results.alreadyExists.push('product-template');
    } else {
      if (templateResult.error) {
        results.errors.push(templateResult.error);
      }
    }

    // 6. Update theme.liquid layout
    const layoutResult = await updateThemeLayout(admin, themeId);
    if (layoutResult.success) {
      results.injected.push('theme-layout');
    } else if (layoutResult.alreadyExists) {
      results.alreadyExists.push('theme-layout');
    } else {
      if (layoutResult.error) {
        results.errors.push(layoutResult.error);
      }
    }

    results.success = results.errors.length === 0;
    return results;

  } catch (error) {
    console.error('Theme injection failed:', error);
    return {
      success: false,
      injected: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      alreadyExists: []
    };
  }
}

async function getThemeAssets(admin: any, themeId: string) {
  const response = await admin.rest.resources.Asset.all({
    session: admin.session,
    theme_id: themeId,
  });
  return response.data;
}

async function injectProductSnippet(admin: any, themeId: string, existingAssets: any[]) {
  const snippetKey = 'snippets/simple-gifting.liquid';
  
  // Check if snippet already exists
  if (existingAssets.some(asset => asset.key === snippetKey)) {
    return { success: false, alreadyExists: true };
  }

  const snippetCode = `{% comment %} Simple Gifting Snippet {% endcomment %}
{% liquid
  assign product_id = product.id | default: ''
  assign product_handle = product.handle | default: ''
  assign max_chars = product.metafields.simple_gifting.max_chars | default: 500
  assign is_gifting_product = product.metafields.simple_gifting.is_gifting_product | default: false
%}

{% if is_gifting_product %}
<div class="simple-gifting-container" 
     data-product-id="{{ product_id }}"
     data-product-handle="{{ product_handle }}"
     data-max-chars="{{ max_chars }}">
  
  <div class="gifting-section">
    <h3 class="gifting-title">🎁 Personalize Your Gift</h3>
    <p class="gifting-description">Add a personal message to make this gift special!</p>
    
    <div class="gifting-form">
      <div class="form-group">
        <label for="gift-message" class="gifting-label">Your Message:</label>
        <textarea 
          id="gift-message"
          name="properties[Gift Message]"
          class="gifting-textarea"
          maxlength="{{ max_chars }}"
          placeholder="Write your personal message here..."
          rows="4"></textarea>
        
        <div class="char-counter">
          <span class="current">0</span>/<span class="max">{{ max_chars }}</span>
        </div>
      </div>
    </div>
  </div>
</div>
{% endif %}`;

  try {
    const asset = new admin.rest.resources.Asset({ session: admin.session });
    asset.theme_id = themeId;
    asset.key = snippetKey;
    asset.value = snippetCode;
    await asset.save({ update: true });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: `Failed to inject snippet: ${error}` };
  }
}

async function injectGiftingStyles(admin: any, themeId: string, existingAssets: any[]) {
  const cssKey = 'assets/simple-gifting.css';
  
  if (existingAssets.some(asset => asset.key === cssKey)) {
    return { success: false, alreadyExists: true };
  }

  const cssCode = `.simple-gifting-container {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #ffffff;
}

.gifting-section {
  width: 100%;
}

.gifting-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.gifting-description {
  color: #6b7280;
  margin: 0 0 16px 0;
  font-size: 14px;
}

.form-group {
  margin-bottom: 16px;
}

.gifting-label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
  font-size: 14px;
}

.gifting-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  min-height: 100px;
  box-sizing: border-box;
}

.gifting-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.char-counter {
  text-align: right;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.char-counter .current.near-limit {
  color: #f59e0b;
}

.char-counter .current.at-limit {
  color: #ef4444;
}

@media (max-width: 768px) {
  .simple-gifting-container {
    margin: 16px 0;
    padding: 16px;
  }
}`;

  try {
    const asset = new admin.rest.resources.Asset({ session: admin.session });
    asset.theme_id = themeId;
    asset.key = cssKey;
    asset.value = cssCode;
    await asset.save({ update: true });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: `Failed to inject CSS: ${error}` };
  }
}

async function injectGiftingScript(admin: any, themeId: string, existingAssets: any[]) {
  const jsKey = 'assets/simple-gifting.js';
  
  if (existingAssets.some(asset => asset.key === jsKey)) {
    return { success: false, alreadyExists: true };
  }

  const jsCode = `document.addEventListener('DOMContentLoaded', function() {
  const giftingContainers = document.querySelectorAll('.simple-gifting-container');
  
  giftingContainers.forEach(function(container) {
    const textarea = container.querySelector('.gifting-textarea');
    const counter = container.querySelector('.char-counter .current');
    const maxChars = parseInt(container.dataset.maxChars);

    if (textarea && counter) {
      function updateCounter() {
        const currentLength = textarea.value.length;
        counter.textContent = currentLength;
        
        // Update counter styling based on character count
        counter.classList.remove('near-limit', 'at-limit');
        if (currentLength >= maxChars * 0.9) {
          counter.classList.add('near-limit');
        }
        if (currentLength >= maxChars) {
          counter.classList.add('at-limit');
        }
      }

      textarea.addEventListener('input', updateCounter);
      updateCounter(); // Initial count
    }
  });
});`;

  try {
    const asset = new admin.rest.resources.Asset({ session: admin.session });
    asset.theme_id = themeId;
    asset.key = jsKey;
    asset.value = jsCode;
    await asset.save({ update: true });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: `Failed to inject JavaScript: ${error}` };
  }
}

async function updateProductTemplate(admin: any, themeId: string) {
  try {
    // Get the main product template
    let templateKey = 'templates/product.liquid';
    let template;
    
    try {
      template = await admin.rest.resources.Asset.all({
        session: admin.session,
        theme_id: themeId,
        'asset[key]': templateKey
      });
    } catch {
      // Try alternative template name
      templateKey = 'sections/product-form.liquid';
      try {
        template = await admin.rest.resources.Asset.all({
          session: admin.session,
          theme_id: themeId,
          'asset[key]': templateKey
        });
      } catch {
        return { success: false, error: 'Could not find product template' };
      }
    }

    if (!template.data || template.data.length === 0) {
      return { success: false, error: 'Product template not found' };
    }

    const currentTemplate = template.data[0];
    const currentCode = currentTemplate.value;

    // Check if our snippet is already included
    if (currentCode.includes('simple-gifting')) {
      return { success: false, alreadyExists: true };
    }

    // Find a good place to inject the snippet (usually after the product form)
    const injectionTargets = [
      '</form>',
      '{{ product.description }}',
      '</div>{% endfor %}', // end of variants
      '{% endif %}'
    ];

    let updatedCode = currentCode;
    let injected = false;

    for (const target of injectionTargets) {
      if (updatedCode.includes(target)) {
        updatedCode = updatedCode.replace(
          target,
          target + '\\n\\n{% render "simple-gifting" %}'
        );
        injected = true;
        break;
      }
    }

    if (!injected) {
      // Fallback: add at the end
      updatedCode += '\\n\\n{% render "simple-gifting" %}';
    }

    // Update the template
    const asset = new admin.rest.resources.Asset({ session: admin.session });
    asset.theme_id = themeId;
    asset.key = templateKey;
    asset.value = updatedCode;
    await asset.save({ update: true });

    return { success: true };
  } catch (error) {
    return { success: false, error: `Failed to update product template: ${error}` };
  }
}

async function updateThemeLayout(admin: any, themeId: string) {
  try {
    const layoutKey = 'layout/theme.liquid';
    
    const layout = await admin.rest.resources.Asset.all({
      session: admin.session,
      theme_id: themeId,
      'asset[key]': layoutKey
    });

    if (!layout.data || layout.data.length === 0) {
      return { success: false, error: 'Theme layout not found' };
    }

    const currentLayout = layout.data[0];
    let currentCode = currentLayout.value;

    // Check if our assets are already included
    if (currentCode.includes('simple-gifting.css') && currentCode.includes('simple-gifting.js')) {
      return { success: false, alreadyExists: true };
    }

    // Inject CSS in head
    if (!currentCode.includes('simple-gifting.css')) {
      currentCode = currentCode.replace(
        '</head>',
        '  {{ "simple-gifting.css" | asset_url | stylesheet_tag }}\\n</head>'
      );
    }

    // Inject JS before closing body
    if (!currentCode.includes('simple-gifting.js')) {
      currentCode = currentCode.replace(
        '</body>',
        '  {{ "simple-gifting.js" | asset_url | script_tag }}\\n</body>'
      );
    }

    // Update the layout
    const asset = new admin.rest.resources.Asset({ session: admin.session });
    asset.theme_id = themeId;
    asset.key = layoutKey;
    asset.value = currentCode;
    await asset.save({ update: true });

    return { success: true };
  } catch (error) {
    return { success: false, error: `Failed to update theme layout: ${error}` };
  }
}

export async function getActiveTheme(admin: any) {
  try {
    const themes = await admin.rest.resources.Theme.all({
      session: admin.session,
    });
    
    const activeTheme = themes.data.find((theme: any) => theme.role === 'main');
    return activeTheme;
  } catch (error) {
    console.error('Failed to get active theme:', error);
    return null;
  }
}

export async function removeThemeCode(admin: any, themeId: string) {
  try {
    const results: {
      success: boolean;
      removed: string[];
      errors: string[];
    } = {
      success: false,
      removed: [],
      errors: []
    };

    // Remove injected files
    const filesToRemove = [
      'snippets/simple-gifting.liquid',
      'assets/simple-gifting.css',
      'assets/simple-gifting.js'
    ];

    for (const fileKey of filesToRemove) {
      try {
        const asset = new admin.rest.resources.Asset({ session: admin.session });
        asset.theme_id = themeId;
        asset.key = fileKey;
        await asset.delete();
        results.removed.push(fileKey);
      } catch (error) {
        // File might not exist, which is fine
        console.log(`File ${fileKey} not found or already removed`);
      }
    }

    results.success = true;
    return results;
  } catch (error) {
    return {
      success: false,
      removed: [],
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}
