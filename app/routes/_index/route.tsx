import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  
  console.log("INDEX ROUTE - URL:", url.toString());
  console.log("INDEX ROUTE - Shop param:", url.searchParams.get("shop"));
  console.log("INDEX ROUTE - Host param:", url.searchParams.get("host"));

  // For embedded apps, we should only handle URLs with shop parameter
  // If shop is present, redirect to the app
  if (url.searchParams.get("shop")) {
    const redirectUrl = `/app?${url.searchParams.toString()}`;
    console.log("INDEX ROUTE - Redirecting to:", redirectUrl);
    throw redirect(redirectUrl);
  }

  // For embedded apps, we should not show a form to enter shop domain
  // This route should only be hit during development or incorrect configuration
  console.log("INDEX ROUTE - Showing embedded app notice");
  return json({ 
    showForm: false, // Never show form for embedded apps
    isEmbeddedApp: true,
    login: Boolean(login)
  });
};

export default function Index() {
  const { showForm, isEmbeddedApp } = useLoaderData<typeof loader>();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Simple Gifting</h1>
        <p className={styles.tagline}>
          The easiest way to offer personalized gift options.
        </p>
        {isEmbeddedApp && (
          <div className={styles.embeddedAppNotice}>
            <p>This app is designed to run embedded within the Shopify admin.</p>
            <p>
              To install this app, please visit the{" "}
              <a href="https://apps.shopify.com/" target="_blank" rel="noopener noreferrer">
                Shopify App Store
              </a>{" "}
              or install it directly from your Partner Dashboard.
            </p>
          </div>
        )}
      </header>

      <main className={styles.main}>
        <div className={styles.features}>
          <div className={styles.feature}>
            <h2 className={styles.featureTitle}>🎁 Enhance Every Gift</h2>
            <p className={styles.featureDescription}>
              Allow customers to add greeting cards, gift wrap, or other items to their purchase with a single click. 
              Boost your average order value by offering thoughtful add-ons.
            </p>
          </div>

          <div className={styles.feature}>
            <h2 className={styles.featureTitle}>💌 Personal Messages</h2>
            <p className={styles.featureDescription}>
              Let shoppers include a personal message with their gifts, creating a more meaningful and 
              customized experience for the recipient.
            </p>
          </div>

          <div className={styles.feature}>
            <h2 className={styles.featureTitle}>⚡ Seamless Integration</h2>
            <p className={styles.featureDescription}>
              Our app blends perfectly into your product pages. The entire process happens in a sleek pop-up, 
              so customers never have to leave the page.
            </p>
          </div>
        </div>

        {!isEmbeddedApp && showForm && (
          <div className={styles.loginSection}>
            <h2>Get Started</h2>
            <p>Enter your shop domain to install Simple Gifting:</p>
            <form className={styles.form} method="post">
              <label className={styles.label}>
                Shop domain{" "}
                <input className={styles.input} type="text" name="shop" />
              </label>
              <button className={styles.button} type="submit">
                Install App
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
} 