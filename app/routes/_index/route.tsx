import { Link } from '@remix-run/react';
import styles from './styles.module.css';

export default function Index() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Simple Gifting</h1>
        <p className={styles.tagline}>The easiest way to offer personalized gift options.</p>
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
      <footer className={styles.footer}>
        <p>Ready to get started?</p>
        <a 
          href="/auth/login" 
          className={styles.ctaButton}
        >
          Install App
        </a>
      </footer>
    </div>
  );
} 