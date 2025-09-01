# Custom App Setup Guide - Private App

## Stap 1: Custom App (Private App) aanmaken in Shopify Admin

**⚠️ Belangrijk**: Dit is GEEN development app, maar een **Custom App** (private app) voor je eigen store.

1. Ga naar je Shopify Admin: `https://coco-sebas.myshopify.com/admin`
2. Navigeer naar **Settings** > **Apps and sales channels**
3. Klik op **Develop apps** (rechtsboven)
4. Als dit je eerste custom app is, klik **Allow custom app development**
5. Klik op **Create an app**
6. Vul in:
   - **App name**: Simple Gifting
   - **App developer**: [Jouw naam/bedrijf]
7. Klik **Create app**

## Stap 2: App configureren

### Configuration tab:
1. **App URL**: `https://jouw-vercel-app.vercel.app/app` (gebruik je Vercel URL!)
2. **Allowed redirection URLs**:
   - `https://jouw-vercel-app.vercel.app/auth/callback`
   - `https://jouw-vercel-app.vercel.app/auth/shopify/callback`
   - `https://jouw-vercel-app.vercel.app/api/auth/callback`

### ❌ GEEN Embedded App!
3. **Embedded app**: ❌ **UITSCHAKELEN** - custom apps werken beter standalone

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
3. **Je custom app is nu geïnstalleerd!**

## Stap 5: App gebruiken

**Custom apps verschijnen NIET in je Apps lijst zoals gewone apps.**

In plaats daarvan:
1. Ga direct naar je app URL: `https://jouw-vercel-app.vercel.app/app`
2. Of maak een bookmark in je browser
3. Of voeg de URL toe aan je Shopify navigation (via theme customization)

## Voor Local Development

Voor lokale development:
1. Update de URLs naar `http://localhost:3000/app`
2. Gebruik ngrok voor een publieke URL tijdens testing
3. Update weer naar je Vercel URL voor productie

## ⚠️ Belangrijke verschillen met gewone apps:

- **Geen embedded mode** - custom apps werken beter standalone
- **Geen app lijst** - directe URL toegang
- **Geen billing** - gratis voor je eigen store  
- **Volledige controle** - je beheert je eigen hosting
