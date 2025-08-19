import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  console.log("AUTH LOGIN LOADER - URL:", url.toString());
  console.log("AUTH LOGIN LOADER - Shop param:", shop);

  // For embedded apps, we should not show a login form
  // If there's no shop parameter, redirect to the index page
  if (!shop) {
    console.log("AUTH LOGIN LOADER - No shop param, redirecting to index");
    throw redirect("/");
  }

  // Attempt to login with the shop parameter
  console.log("AUTH LOGIN LOADER - Attempting login for shop:", shop);
  const loginResult = await login(request);
  
  console.log("AUTH LOGIN LOADER - Login result:", typeof loginResult);
  
  // If login returns a redirect response, throw it
  if (loginResult instanceof Response) {
    console.log("AUTH LOGIN LOADER - Login returned redirect, throwing response");
    throw loginResult;
  }

  // If login was successful, redirect to the app
  console.log("AUTH LOGIN LOADER - Login successful, redirecting to app");
  throw redirect(`/app?shop=${shop}`);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const loginResult = await login(request);
  
  // If login returns a redirect response, throw it
  if (loginResult instanceof Response) {
    throw loginResult;
  }

  // If login was successful, redirect to the app
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  if (shop) {
    throw redirect(`/app?shop=${shop}`);
  }

  throw redirect("/app");
};

// For embedded apps, we don't render a UI component
// The login process happens automatically via redirects
export default function Auth() {
  return null;
}
