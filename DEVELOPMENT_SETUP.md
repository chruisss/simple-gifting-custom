# Development Setup - Custom App

## Custom App Setup

Deze app is geconfigureerd als een Custom App voor een specifieke Shopify store. Volg deze stappen:

### 1. Custom App aanmaken
Volg de instructies in `CUSTOM_APP_SETUP.md` om een custom app aan te maken in je Shopify Admin.

### 2. Environment Variables
1. Kopieer `.env.example` naar `.env`
2. Vul de credentials in die je krijgt van je Custom App:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` met je app credentials:
   - `SHOPIFY_API_KEY` - API key van je custom app
   - `SHOPIFY_API_SECRET` - API secret van je custom app
   - `SHOPIFY_SHOP_DOMAIN` - je shop domain (bijv: coco-sebas.myshopify.com)
   - `SHOPIFY_APP_URL` - je app URL (tijdens development bijv: http://localhost:3000)

### 3. Development Server
```bash
# Installeer dependencies
npm install

# Setup database
npm run setup

# Start development server
npm run dev
```

Je app draait nu op `http://localhost:3000`

### 4. Ngrok voor testing (optioneel)
Voor testing met een externe URL:
```bash
# Installeer ngrok
brew install ngrok

# Start ngrok
ngrok http 3000
```

Update dan je `SHOPIFY_APP_URL` in `.env` met de ngrok URL.

### 5. App URL configureren
Update in je Shopify Custom App admin:
- **App URL**: `http://localhost:3000` (of je ngrok URL)
- **Allowed redirection URLs**:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/shopify/callback`
  - `http://localhost:3000/api/auth/callback`

## Scripts

- `npm run dev` - Start development server (zonder Shopify CLI)
- `npm run dev:shopify` - Start development server (met Shopify CLI)
- `npm run build` - Build voor productie
- `npm run start` - Start productie server