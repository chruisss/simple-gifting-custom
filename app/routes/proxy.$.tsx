import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getShopConfiguration } from "../models/ShopConfiguration.server";
import { authenticate } from "../shopify.server";

const GIFTING_TAG = "simple-gifting-product";
const METAFIELD_NAMESPACE = "simple_gifting";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const path = params["*"];

  // Enable CORS and disable caching for public API
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  if (!shop) {
    return json({ error: "Shop parameter is required" }, { status: 400, headers });
  }

  try {
    // Handle different proxy endpoints
    switch (path) {
      case "products": {
        const { admin } = await authenticate.public.appProxy(request);
        return handleGiftingProductsRequest(admin, shop, headers);
      }
      
      case "styling": {
        // Get shop configuration
        const config = await getShopConfiguration(shop);
        
        // Return only styling-related configuration
        const stylingConfig = {
          primaryColor: (config as any).primaryColor,
          secondaryColor: (config as any).secondaryColor,
          accentColor: (config as any).accentColor,
          backgroundColor: (config as any).backgroundColor,
          textColor: (config as any).textColor,
          buttonStyle: (config as any).buttonStyle,
          buttonSize: (config as any).buttonSize,
          buttonBorderRadius: (config as any).buttonBorderRadius,
          fontFamily: (config as any).fontFamily,
          fontSize: (config as any).fontSize,
          fontWeight: (config as any).fontWeight,
          modalAnimation: (config as any).modalAnimation,
          autoOpenPopup: (config as any).autoOpenPopup,
          blurBackground: (config as any).blurBackground,
          customCss: (config as any).customCss,
          customFontUrl: (config as any).customFontUrl,
        };
        
        return json(stylingConfig, { headers });
      }

      case "config": {
        // Get general configuration
        const config = await getShopConfiguration(shop);
        
        // Return general configuration (without sensitive data)
        const publicConfig = {
          popupTitle: "Voeg een persoonlijk bericht toe",
          popupAddButtonText: "Voeg toe",
          popupCancelButtonText: "Annuleren", 
          defaultCharLimit: 250,
          appIsEnabled: config.appIsEnabled,
        };
        
        return json(publicConfig, { headers });
      }

      default:
        return json({ error: "Endpoint not found" }, { status: 404, headers });
    }
  } catch (error) {
    console.error("Public proxy error:", error);
    // For an app proxy, any error during authentication should result in a 401.
    // We return a JSON response instead of letting Remix handle the thrown Response,
    // which would result in an HTML page that breaks the client-side fetch.
    return json({ error: "Authentication failed." }, { status: 401, headers });
  }
};

async function handleGiftingProductsRequest(admin: any, shop: string, headers: Record<string, string>) {
  try {
    let query = `tag:${GIFTING_TAG}`;
    
    const response = await admin.graphql(
      `#graphql
        query getGiftingProducts($query: String!) {
          products(first: 50, query: $query) {
            edges {
              node {
                id
                title
                handle
                featuredImage {
                  url
                }
                variants(first: 10) {
                  edges {
                    node {
                      id
                      title
                      price
                    }
                  }
                }
                productType: metafield(namespace: "${METAFIELD_NAMESPACE}", key: "product_type") {
                  value
                }
                maxChars: metafield(namespace: "${METAFIELD_NAMESPACE}", key: "max_chars") {
                  value
                }
                ribbonLength: metafield(namespace: "${METAFIELD_NAMESPACE}", key: "ribbon_length") {
                  value
                }
                customizable: metafield(namespace: "${METAFIELD_NAMESPACE}", key: "customizable") {
                  value
                }
              }
            }
          }
        }
      `,
      {
        variables: { query }
      }
    );

    const responseJson = await response.json();
    
    if (responseJson.errors) {
      console.error("GraphQL errors:", responseJson.errors);
      return json({
        products: [],
        error: "GraphQL query failed",
        debug: responseJson.errors
      }, { headers });
    }

    const products = responseJson.data?.products?.edges
      ?.map((edge: any) => {
        const node = edge.node;
        const firstVariant = node.variants.edges[0]?.node;
        
        if (!firstVariant) {
          return null; // Skip product if no variants exist
        }
        
        return {
          id: node.id,
          variantId: firstVariant.id,
          title: node.title,
          handle: node.handle,
          imageUrl: node.featuredImage?.url,
          price: parseFloat(firstVariant.price || "0"),
          maxCharacters: parseInt(node.maxChars?.value || "150"),
          customizable: node.customizable?.value === "true",
          productType: node.productType?.value,
          ribbonLength: parseInt(node.ribbonLength?.value || "0"),
          variants: node.variants.edges
            .map((variantEdge: any) => ({
              id: variantEdge.node.id,
              title: variantEdge.node.title,
              price: parseFloat(variantEdge.node.price || "0")
            }))
        };
      })
      .filter(Boolean) || []; // Filter out null products

    const responseData = {
      products: products,
      debug: {
        shop,
        tag: GIFTING_TAG,
        namespace: METAFIELD_NAMESPACE,
        productCount: products.length
      }
    };

    return json(responseData, { headers });
  } catch (error) {
    console.error("Error in handleGiftingProductsRequest:", error);
    return json({
      products: [],
      error: "Failed to fetch products",
      debug: {
        shop,
        error: String(error)
      }
    }, { status: 500, headers });
  }
}