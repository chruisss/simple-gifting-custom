import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    console.log("Auth callback route called");
    const { session, admin } = await authenticate.admin(request);
    console.log("Authentication successful for shop:", session.shop);
    
    // After successful authentication, redirect to the app
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/app?shop=${session.shop}`,
      },
    });
  } catch (error) {
    console.error("Error in auth callback:", error);
    return new Response("Authentication failed", { status: 500 });
  }
};
