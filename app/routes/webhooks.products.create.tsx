import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getShopConfiguration } from "../models/ShopConfiguration.server";

const GIFTING_TAG = "simple-gifting-product";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { payload, admin, session, topic, shop } = await authenticate.webhook(request);
  
  console.log(`Received ${topic} webhook for ${shop}`);
  
  // Get shop configuration to check if auto-tagging is enabled
  const config = await getShopConfiguration(shop);
  
  if (!(config as any).autoTagging) {
    console.log("Auto-tagging is disabled, skipping product tagging");
    return new Response("Auto-tagging disabled", { status: 200 });
  }
  
  // Check if admin is available
  if (!admin) {
    console.error("Admin GraphQL client not available");
    return new Response("Admin client unavailable", { status: 500 });
  }
  
  // Get product data from webhook payload
  const product = payload;
  const productId = `gid://shopify/Product/${product.id}`;
  
  console.log(`Processing product ${productId} for auto-tagging`);
  
  try {
    // Check if product already has the gifting tag
    const currentTags = product.tags ? product.tags.split(', ') : [];
    
    if (currentTags.includes(GIFTING_TAG)) {
      console.log(`Product ${productId} already has gifting tag`);
      return new Response("Product already tagged", { status: 200 });
    }
    
    // Add the gifting tag to the product
    const newTags = [...currentTags, GIFTING_TAG];
    
    // Also add default metafields for new gifting products
    const metafields = [
      {
        namespace: "simple_gifting",
        key: "product_type",
        type: "single_line_text_field",
        value: "card", // Default to card type
      },
      {
        namespace: "simple_gifting",
        key: "max_chars",
        type: "number_integer",
        value: ((config as any).defaultCharLimit || 150).toString(),
      },
      {
        namespace: "simple_gifting",
        key: "customizable",
        type: "boolean",
        value: "true",
      }
    ];
    
    // Update product with new tags and metafields
    const updateResponse = await admin.graphql(
      `#graphql
        mutation updateProduct($input: ProductInput!) {
          productUpdate(input: $input) {
            product {
              id
              title
              tags
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        variables: {
          input: {
            id: productId,
            tags: newTags,
            metafields,
          },
        },
      }
    );
    
    const updateResult = await updateResponse.json();
    
    if (updateResult.data?.productUpdate?.userErrors?.length > 0) {
      console.error(`Failed to update product ${productId}:`, updateResult.data.productUpdate.userErrors);
      return new Response("Failed to update product", { status: 500 });
    }
    
    console.log(`Successfully tagged product ${productId} with gifting tag and default metafields`);
    return new Response("Product tagged successfully", { status: 200 });
    
  } catch (error) {
    console.error(`Error processing product ${productId}:`, error);
    return new Response("Internal server error", { status: 500 });
  }
}; 