import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  if (!shop) {
    // The app is not installed in this shop.
    // We can just respond with a 200 OK.
    return new Response();
  }

  // Process the webhook payload to redact shop data.
  // The payload contains the shop domain.
  console.log(`Received ${topic} webhook for ${shop}.`);
  console.log('Payload:', payload);

  // In a real app, you would delete all data associated with this shop.
  // For example: await db.session.deleteMany({ where: { shop } });
  // and any other shop-specific data.
  // Note: app/uninstalled already deletes session data. You might want to have more
  // comprehensive deletion here.

  return new Response();
}; 