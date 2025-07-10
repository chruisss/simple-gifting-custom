import { ActionFunctionArgs, json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async () => {
  return json({
    polarisTranslations: require("@shopify/polaris/locales/en.json"),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop } = await request.json();

  if (!shop) {
    return json({ error: "Shop domain is required" }, { status: 400 });
  }

  return login(request);
};

export default function Index() {
  const { polarisTranslations } = useLoaderData<typeof loader>();

  return (
    <div className={styles.container}>
      <h1>A short heading about [your app]</h1>
      <p>A tagline about [your app] that describes your value proposition.</p>
      <Form method="post" className={styles.form}>
        <label>
          <span>Shop domain</span>
          <input type="text" name="shop" placeholder="e.g: my-shop-domain.myshopify.com" />
        </label>
        <button type="submit">Log in</button>
      </Form>
    </div>
  );
} 