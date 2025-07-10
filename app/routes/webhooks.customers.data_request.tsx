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

  // Process the webhook payload.
  // This is where you would add your logic to handle the customer data request.
  // For compliance, you must be able to provide the data you have stored for the given customer.
  // The payload contains customer and order information.
  console.log(`Received ${topic} webhook for ${shop}.`);
  console.log('Payload:', payload);

  // For now, we will just log the request and return a success response.
  // In a real app, you would fetch and return the customer's data.

  return new Response();
}; 