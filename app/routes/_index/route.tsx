import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import styles from './styles.module.css';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  // If we have a shop parameter, redirect to app (embedded flow)
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return json({ showForm: true });
};

export default function Index() {
  const { showForm } = useLoaderData<typeof loader>();
  const [shop, setShop] = useState("");

  const handleInstall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    
    // Clean shop domain
    const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const shopDomain = cleanShop.includes('.myshopify.com') ? cleanShop : `${cleanShop}.myshopify.com`;
    
    // For the new embedded auth strategy, redirect to the app with shop parameter
    // This triggers the managed installation flow
    window.location.href = `${window.location.origin}/app?shop=${shopDomain}`;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Simple Gifting</h1>
        <p className={styles.tagline}>The easiest way to offer personalized gift options.</p>
        
        {showForm && (
          <form onSubmit={handleInstall} className={styles.installForm}>
            <div className={styles.formGroup}>
              <label htmlFor="shop" className={styles.label}>
                Shop domain
              </label>
              <input 
                type="text" 
                id="shop"
                name="shop" 
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                placeholder="my-shop-domain.myshopify.com"
                className={styles.input}
                required
              />
            </div>
            <button type="submit" className={styles.ctaButton}>
              Install App
            </button>
          </form>
        )}
      </header>
      
      <main className={styles.main}>
        <div className={styles.feature}>
          <h2 className={styles.featureTitle}>Enhance Every Gift</h2>
          <p>Allow customers to add greeting cards, gift wrap, or other items to their purchase with a single click. Boost your average order value by offering thoughtful add-ons.</p>
        </div>
        <div className={styles.feature}>
          <h2 className={styles.featureTitle}>Personal Messages</h2>
          <p>Let shoppers include a personal message with their gifts, creating a more meaningful and customized experience for the recipient.</p>
        </div>
        <div className={styles.feature}>
          <h2 className={styles.featureTitle}>Seamless Integration</h2>
          <p>Our app blends perfectly into your product pages. The entire process happens in a sleek pop-up, so customers never have to leave the page.</p>
        </div>
      </main>
    </div>
  );
} 