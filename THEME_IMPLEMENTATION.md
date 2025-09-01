# Theme Implementation Guide

## 🎨 Simple Gifting Theme Integration

Deze guide laat zien hoe je de Simple Gifting app integreert in je Shopify theme.

## 📁 Theme Extension Structuur

Je app heeft al een theme extension in `extensions/product-personalisatie/`:

```
extensions/product-personalisatie/
├── shopify.extension.toml     # Extension configuratie
├── embed.liquid               # App embed (global)
├── gifting-app.js            # Frontend JavaScript
├── gifting-styles.css        # CSS styling
├── blocks/
│   └── simple-gifting.liquid # App block voor secties
├── assets/
├── locales/
└── snippets/
```

## 🚀 Quick Start - Theme Implementation

### Stap 1: Custom App configureren
1. Volg `CUSTOM_APP_SETUP.md` om je Custom App aan te maken
2. Zorg dat de app correct werkt op `https://jouw-vercel-app.vercel.app/app`

### Stap 2: Theme Extension activeren

#### A. Via Theme Editor (Aanbevolen):
1. **Ga naar Theme Editor**: `https://coco-sebas.myshopify.com/admin/themes`
2. **Klik "Customize"** op je actieve theme
3. **Ga naar een Product pagina**
4. **Add section** → Zoek naar **"Simple Gifting"**
5. **Sleep het naar gewenste positie** (meestal onder product form)
6. **Configureer instellingen**:
   - Title: "🎁 Personalize Your Gift"
   - Description: "Add a personal message to make this gift special!"
   - Show recipient/sender name fields (optioneel)
   - Styling kleuren aanpassen
7. **Save**

#### B. App Embed (Globaal):
1. **Theme settings** → **App embeds** (onderaan)
2. **Find "Simple Gifting"** → **Enable** ✅
3. **Save**

### Stap 3: Theme Code Injection

Je hebt **2 opties** om de Simple Gifting functionaliteit aan je theme toe te voegen:

#### Optie A: Automatische Injection (Aanbevolen! 🚀)
1. **Open je Simple Gifting app**: `https://jouw-vercel-app.vercel.app/app`
2. **Klik op "Setup & Installation"** in de linker navigatie
   
   *Of ga direct naar: `https://jouw-vercel-app.vercel.app/app/install`*

3. **Zoek de "Inject Theme Code" sectie**
4. **Klik op "Inject Code"** button
5. **Wacht tot de injection compleet is** ✅ (groen vinkje)
6. **Klaar!** De code is automatisch toegevoegd aan:
   - `snippets/simple-gifting.liquid`
   - `assets/simple-gifting.css` 
   - `assets/simple-gifting.js`
   - Product template (automatisch snippet include)
   - Theme layout (CSS & JS references)

#### Optie B: Handmatige Theme Implementation

#### Optie B: Handmatige Theme Implementation

##### A. Via Theme Editor (Theme Extension):
1. **Ga naar Theme Editor**: `https://coco-sebas.myshopify.com/admin/themes`
2. **Klik "Customize"** op je actieve theme
3. **Ga naar een Product pagina**
4. **Add section** → Zoek naar **"Simple Gifting"**
5. **Sleep het naar gewenste positie** (meestal onder product form)
6. **Configureer instellingen** en **Save**

##### B. Handmatige Code Toevoegen:

```liquid
{% comment %} Simple Gifting Integration {% endcomment %}
{% if product.metafields.simple_gifting.is_gifting_product %}
  <div id="simple-gifting-container" 
       data-product-id="{{ product.id }}"
       data-product-handle="{{ product.handle }}"
       data-max-chars="{{ product.metafields.simple_gifting.max_chars | default: 500 }}">
    
    <div class="gifting-section">
      <h3>🎁 Personalize Your Gift</h3>
      <p>Add a personal message to make this gift special!</p>
      
      <div class="gifting-form">
        <label for="gift-message">Your Message:</label>
        <textarea 
          id="gift-message" 
          name="properties[Gift Message]"
          maxlength="{{ product.metafields.simple_gifting.max_chars | default: 500 }}"
          placeholder="Write your personal message here..."></textarea>
        
        <div class="char-counter">
          <span class="current">0</span>/<span class="max">{{ product.metafields.simple_gifting.max_chars | default: 500 }}</span>
        </div>
      </div>
    </div>
  </div>
{% endif %}
```

#### B. Theme Layout (theme.liquid)

```liquid
{% comment %} In de <head> sectie {% endcomment %}
{{ 'gifting-styles.css' | asset_url | stylesheet_tag }}

{% comment %} Voor de </body> tag {% endcomment %}
{{ 'gifting-app.js' | asset_url | script_tag }}
<script>
  document.addEventListener('DOMContentLoaded', function() {
    if (window.SimpleGifting) {
      SimpleGifting.init();
    }
  });
</script>
```

## ⚙️ Product Configuration

### Stap 4: Product Metafields instellen

**Na de theme injection** moet je nog de producten configureren die gifting ondersteunen:

#### Via Simple Gifting App (Aanbevolen):
1. **Open je Simple Gifting app**: `https://jouw-vercel-app.vercel.app/app`
2. **Klik op "Products"** in de linker navigatie
   
   *Of ga direct naar: `https://jouw-vercel-app.vercel.app/app/cards`*

3. **Selecteer producten** die gifting moeten ondersteunen
4. **Enable gifting** met één klik  
5. **Stel max characters in** (default: 500)

#### Handmatig via Shopify Admin:
Voor elk product dat gifting moet ondersteunen:

1. **Product admin** → **Edit product**
2. **Metafields sectie**:
   - `simple_gifting.is_gifting_product` = `true`
   - `simple_gifting.max_chars` = `500` (of gewenste limiet)
   - `simple_gifting.gifting_product_handle` = handle van gift card product
3. **Save product**

### App Block Settings

In `blocks/simple-gifting.liquid` kun je deze instellingen configureren:

- **Titel tekst**
- **Placeholder tekst**
- **Maximum karakters**
- **Styling opties**
- **Positie op de pagina**

### App Embed Settings

In `embed.liquid` voor globale functionaliteit:

- **Enable/disable** de app
- **Debug modus**
- **API endpoints**
- **Globale styling**

## 🎯 Gebruikersflow

1. **Klant bezoekt product pagina**
2. **Ziet Simple Gifting sectie** (als product gifting-enabled is)
3. **Voert persoonlijke boodschap in**
4. **Voegt product toe aan winkelwagen**
5. **Boodschap wordt opgeslagen** als cart property
6. **Checkout** met persoonlijke boodschap
7. **Order bevat** de gift message

## 🔧 Testing

### Local Testing:
```bash
# Start je development server
npm run dev

# Test je theme extension
# Ga naar je store en test de functionaliteit
```

### Live Testing:
1. Deploy je app naar Vercel
2. Update je Custom App URLs
3. Test op je live store

## 📱 Responsive Design

De theme extension is responsive en werkt op:
- ✅ Desktop
- ✅ Tablet  
- ✅ Mobile

## 🛠️ Aanpassingen

Je kunt de theme extension aanpassen door:

1. **CSS styling** in `gifting-styles.css`
2. **JavaScript functionaliteit** in `gifting-app.js`
3. **Liquid templates** in de blocks en embeds
4. **Instellingen** in de app admin

## 🚀 Go Live

1. ✅ App gedeployed op Vercel
2. ✅ Custom App geconfigureerd in Shopify
3. ✅ Theme extension geactiveerd
4. ✅ Product metafields ingesteld
5. ✅ Tested op alle devices

Je Simple Gifting functionaliteit is nu live! 🎉
