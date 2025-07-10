import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { authenticate, login } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Handles the OAuth callback from Shopify.
  // authenticate.admin will internally handle the redirect.
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Handles the form submission from the index page to initiate OAuth.
  return login(request);
}; 