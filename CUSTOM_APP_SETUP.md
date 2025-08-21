# Custom App Setup Guide - Embedded App

## Stap 1: Custom App aanmaken in Shopify Admin

1. Ga naar je Shopify Admin: `https://coco-sebas.myshopify.com/admin`
2. Navigeer naar **Settings** > **Apps and sales channels**
3. Klik op **Develop apps** (rechtsboven)
4. Klik op **Create an app**
5. Vul in:
   - **App name**: Simple Gifting
   - **App developer**: [Jouw naam/bedrijf]
6. Klik **Create app**

## Stap 2: App configureren voor Embedded mode

### Configuration tab:
1. **App URL**: `http://localhost:3000/app` (belangrijk: `/app` pad toevoegen!)
2. **Allowed redirection URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/shopify/callback`
   - `http://localhost:3000/api/auth/callback`

### Embedded App Settings:
3. **Embedded app**: ✅ **Zorg dat dit is INGESCHAKELD**
4. **App bridge version**: Latest (standaard)

### Scopes configureren:
In de **API Access** sectie, klik **Configure** en selecteer de volgende scopes:
- ✅ `read_products` - Read access to products
- ✅ `write_products` - Write access to products
- ✅ `read_themes` - Read access to themes
- ✅ `write_themes` - Write access to themes
- ✅ `read_orders` - Read access to orders
- ✅ `write_orders` - Write access to orders

Klik **Save** om de scopes op te slaan.

### Webhooks configureren (optioneel):
1. **Webhook endpoint**: `http://localhost:3000/webhooks`
2. Voeg de volgende webhook subscriptions toe:
   - `app/uninstalled` → `/webhooks/app/uninstalled`
   - `products/create` → `/webhooks/products/create`

## Stap 3: Credentials ophalen

1. Ga naar de **API credentials** tab
2. Noteer:
   - **API key** (Client ID)
   - **API secret key** (Client Secret) - klik op "Reveal"

## Stap 4: App installeren

1. Klik op **Install app** 
2. Bevestig de installatie

## Stap 5: App openen in Shopify Admin

Na installatie:
1. Ga naar **Apps** in je Shopify Admin sidebar
2. Klik op **Simple Gifting** 
3. Je app opent nu embedded in Shopify! 🎉

## Voor Productie

Voor productie deployment, update de URLs naar je live domain:
- **App URL**: `https://jouw-domain.com/app`
- **Allowed redirection URLs** met `https://jouw-domain.com/...`
