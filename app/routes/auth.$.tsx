import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  if (shop) {
    // Met de nieuwe embedded auth strategy redirect je direct naar de app
    // De token exchange wordt automatisch afgehandeld door App Bridge
    return redirect(`/app?shop=${shop}`);
  }
  
  // Fallback naar app zonder shop parameter
  return redirect("/app");
}; 