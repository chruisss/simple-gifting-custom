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
  
  // Process the webhook payload to redact customer data.
  // The payload contains the customer ID and the shop ID.
  console.log(`Received ${topic} webhook for ${shop}.`);
  console.log('Payload:', payload);

  // In a real app, you would delete all data associated with this customer.
  // For example: await db.customer.deleteMany({ where: { id: payload.customer.id, shop }});

  return new Response();
}; 