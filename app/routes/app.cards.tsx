import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import {
  useLoaderData,
  useNavigate,
  useNavigation,
  useActionData,
  useFetcher,
} from "@remix-run/react";
import { 
  Page, 
  Layout, 
  Text, 
  DataTable, 
  EmptyState, 
  Tabs, 
  Button,
  Card,
  BlockStack,
  InlineStack,
  Badge,
  TextField,
  Select,
  ButtonGroup,
  Icon,
  Divider,
  Banner,
  Filters,
  ChoiceList,
  Grid,
  Tooltip,
  Modal,
  FormLayout,
  Checkbox,
  Toast,
  Frame
} from "@shopify/polaris";
import { 
  SearchIcon, 
  FilterIcon, 
  ProductIcon,
  GiftCardIcon,
  SettingsIcon,
  EditIcon,
  PlusIcon,
  DeleteIcon
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { useState, useCallback, useMemo, useEffect } from "react";

const GIFTING_TAG = "simple-gifting-product";

interface ProductNode {
    id: string;
    title: string;
    handle: string;
    status: string;
    totalInventory: number;
    tags: string[];
    productType?: { value: string };
    maxChars?: { value: string };
    ribbonLength?: { value: string };
    customizable?: { value: string };
}

interface ExistingProduct {
    id: string;
    title: string;
    handle: string;
    status: string;
    totalInventory: number;
    tags: string[];
    productType?: string;
    featuredImage?: {
        url: string;
    };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("Loader called for app.cards");
  
  const { admin, session } = await authenticate.admin(request);
  console.log("Authentication successful, session:", session?.shop, session?.id);
  
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "all";
  
  let query = `tag:${GIFTING_TAG}`;

  if (search) {
    query += ` AND title:*${search}*`;
  }

  if (status !== "all") {
    query += ` AND status:${status}`;
  }

  const response = await admin.graphql(
    `#graphql
      query getGiftingProducts($query: String!) {
        products(first: 50, query: $query) {
          edges {
            node {
              id
              title
              handle
              status
              totalInventory
              tags
              createdAt
              updatedAt
              productType: metafield(namespace: "simple_gifting", key: "product_type") {
                value
                type
                id
              }
              maxChars: metafield(namespace: "simple_gifting", key: "max_chars") {
                value
                type
                id
              }
              ribbonLength: metafield(namespace: "simple_gifting", key: "ribbon_length") {
                value
                type
                id
              }
              customizable: metafield(namespace: "simple_gifting", key: "customizable") {
                value
                type
                id
              }
              # Let's also fetch all metafields to see what's available
              metafields(first: 20, namespace: "simple_gifting") {
                edges {
                  node {
                    id
                    key
                    value
                    type
                  }
                }
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

  console.log("GraphQL response status:", response.status);
  console.log("GraphQL response headers:", Object.fromEntries(response.headers.entries()));
  
  // Also fetch existing products that are not yet linked to gifting
  const existingProductsResponse = await admin.graphql(
    `#graphql
      query getExistingProducts {
        products(first: 100, query: "NOT tag:simple-gifting-product") {
          edges {
            node {
              id
              title
              handle
              status
              totalInventory
              tags
              productType
              featuredImage {
                url
              }
            }
          }
        }
      }
    `
  );

  // Check if responses are JSON - Shopify GraphQL API returns text/plain but with valid JSON
  const contentType = response.headers.get("content-type");
  const existingContentType = existingProductsResponse.headers.get("content-type");
  
  // Try to parse as JSON regardless of content-type since Shopify GraphQL API returns text/plain
  let responseJson, existingResponseJson;
  
  try {
    responseJson = await response.json();
  } catch (error) {
    const errorText = await response.text();
    console.error("Products response is not valid JSON:", errorText);
    console.error("Response status:", response.status);
    console.error("Response headers:", Object.fromEntries(response.headers.entries()));
    throw new Error(`GraphQL service not available - Status: ${response.status} - Content: ${errorText.substring(0, 500)}...`);
  }
  
  try {
    existingResponseJson = await existingProductsResponse.json();
  } catch (error) {
    const errorText = await existingProductsResponse.text();
    console.error("Existing products response is not valid JSON:", errorText);
    console.error("Response status:", existingProductsResponse.status);
    console.error("Response headers:", Object.fromEntries(existingProductsResponse.headers.entries()));
    throw new Error(`GraphQL service not available - Status: ${existingProductsResponse.status} - Content: ${errorText.substring(0, 500)}...`);
  }
  
  const products = responseJson.data?.products?.edges?.map((edge: any) => edge.node) || [];
  const existingProducts = existingResponseJson.data?.products?.edges?.map((edge: any) => edge.node) || [];

  // Debug: Log metafield information
  console.log("Products with metafield debug info:");
  products.forEach((product: any) => {
    console.log(`Product: ${product.title}`);
    console.log(`- productType:`, product.productType);
    console.log(`- maxChars:`, product.maxChars);
    console.log(`- ribbonLength:`, product.ribbonLength);
    console.log(`- customizable:`, product.customizable);
    console.log(`- All metafields:`, product.metafields?.edges?.map((e: any) => ({ key: e.node.key, value: e.node.value, type: e.node.type })));
  });

  return json({ 
    products, 
    existingProducts,
    search, 
    status, 
    shop: session.shop 
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("Action called for app.cards");
  
  const { admin } = await authenticate.admin(request);
  console.log("Action authentication successful");
  
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  console.log("Action called with intent:", intent);
  
  if (intent === "linkProduct") {
    const productId = formData.get("productId") as string;
    const giftingType = formData.get("giftingType") as string;
    const maxChars = formData.get("maxChars") as string;
    const ribbonLength = formData.get("ribbonLength") as string;
    const customizable = formData.get("customizable") === "true";
    
    console.log("Link product data:", { productId, giftingType, maxChars, ribbonLength, customizable });
    
    try {
      // Determine the tag to add
      const tagToAdd = GIFTING_TAG;
      
      // Get current product to append new tag
      const currentProductResponse = await admin.graphql(
        `#graphql
          query getProduct($id: ID!) {
            product(id: $id) {
              id
              tags
            }
          }
        `,
        { variables: { id: productId } }
      );
      
      console.log("Current product response status:", currentProductResponse.status);
      console.log("Current product response headers:", Object.fromEntries(currentProductResponse.headers.entries()));
      
      // Try to parse as JSON regardless of content-type since Shopify GraphQL API returns text/plain
      let currentProduct;
      try {
        currentProduct = await currentProductResponse.json();
      } catch (error) {
        const errorText = await currentProductResponse.text();
        console.error("GraphQL response is not valid JSON:", errorText);
        return json({ 
          success: false, 
          message: "GraphQL service niet beschikbaar",
          error: "Invalid JSON response"
        }, { status: 500 });
      }
      console.log("Current product response:", currentProduct);
      
      if ((currentProduct as any).errors) {
        console.error("GraphQL errors:", (currentProduct as any).errors);
        return json({ 
          success: false, 
          message: "Product niet gevonden",
          errors: (currentProduct as any).errors 
        }, { status: 404 });
      }
      
      const currentTags = currentProduct.data?.product?.tags || [];
      const newTags = [...currentTags, tagToAdd];
      
      // Prepare metafields
      const metafields = [
        {
          namespace: "simple_gifting",
          key: "product_type",
          type: "single_line_text_field",
          value: giftingType,
        },
        {
          namespace: "simple_gifting",
          key: "max_chars",
          type: "number_integer",
          value: maxChars,
        },
        {
          namespace: "simple_gifting",
          key: "customizable",
          type: "boolean",
          value: customizable.toString(),
        }
      ];
      
      // Add ribbon length if it's a ribbon
      if (giftingType === "ribbon" && ribbonLength) {
        metafields.push({
          namespace: "simple_gifting",
          key: "ribbon_length",
          type: "number_integer",
          value: ribbonLength,
        });
      }
      
      console.log("Updating product with:", { productId, newTags, metafields });
      
      // Update product with tags and metafields
      const updateResponse = await admin.graphql(
        `#graphql
          mutation updateProduct($input: ProductInput!) {
            productUpdate(input: $input) {
              product {
                id
                title
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
      
      // Try to parse as JSON regardless of content-type since Shopify GraphQL API returns text/plain
      let updateResult;
      try {
        updateResult = await updateResponse.json();
      } catch (error) {
        const errorText = await updateResponse.text();
        console.error("GraphQL update response is not valid JSON:", errorText);
        return json({ 
          success: false, 
          message: "GraphQL service niet beschikbaar bij bijwerken",
          error: "Invalid JSON response"
        }, { status: 500 });
      }
      console.log("Update result:", updateResult);
      
      if ((updateResult as any).errors) {
        console.error("GraphQL update errors:", (updateResult as any).errors);
        return json({ 
          success: false, 
          message: "GraphQL fout bij bijwerken product",
          errors: (updateResult as any).errors 
        }, { status: 500 });
      }
      
      if (updateResult.data?.productUpdate?.userErrors?.length > 0) {
        console.error("Product update user errors:", updateResult.data.productUpdate.userErrors);
        return json({ 
          success: false, 
          message: "Fout bij bijwerken product: " + updateResult.data.productUpdate.userErrors.map((e: any) => e.message).join(", "),
          errors: updateResult.data.productUpdate.userErrors 
        }, { status: 400 });
      }
      
      return json({ 
        success: true, 
        message: "Product succesvol gekoppeld aan gifting systeem!" 
      });
      
    } catch (error) {
      console.error("Unexpected error in linkProduct:", error);
      return json({ 
        success: false, 
        message: "Onverwachte fout: " + (error instanceof Error ? error.message : String(error))
      }, { status: 500 });
    }
  }
  
  if (intent === "repairMetafields") {
    const productId = formData.get("productId") as string;
    
    console.log("Repairing metafields for product:", productId);
    
    try {
      // Get current product
      const currentProductResponse = await admin.graphql(
        `#graphql
          query getProduct($id: ID!) {
            product(id: $id) {
              id
              title
              tags
            }
          }
        `,
        { variables: { id: productId } }
      );
      
      const currentProduct = await currentProductResponse.json();
      
      if ((currentProduct as any).errors) {
        console.error("GraphQL errors:", (currentProduct as any).errors);
        return json({ 
          success: false, 
          message: "Product niet gevonden",
          errors: (currentProduct as any).errors 
        }, { status: 404 });
      }
      
      // Set default metafields for repair
      const metafields = [
        {
          namespace: "simple_gifting",
          key: "product_type",
          type: "single_line_text_field",
          value: "card",
        },
        {
          namespace: "simple_gifting",
          key: "max_chars",
          type: "number_integer",
          value: "150",
        },
        {
          namespace: "simple_gifting",
          key: "customizable",
          type: "boolean",
          value: "true",
        }
      ];
      
      console.log("Setting repair metafields:", metafields);
      
      // Update product with metafields
      const updateResponse = await admin.graphql(
        `#graphql
          mutation updateProduct($input: ProductInput!) {
            productUpdate(input: $input) {
              product {
                id
                title
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
              metafields,
            },
          },
        }
      );
      
      const updateResult = await updateResponse.json();
      console.log("Repair update result:", updateResult);
      
      if ((updateResult as any).errors) {
        console.error("GraphQL update errors:", (updateResult as any).errors);
        return json({ 
          success: false, 
          message: "GraphQL fout bij herstel metafields",
          errors: (updateResult as any).errors 
        }, { status: 500 });
      }
      
      if (updateResult.data?.productUpdate?.userErrors?.length > 0) {
        console.error("Product update user errors:", updateResult.data.productUpdate.userErrors);
        return json({ 
          success: false, 
          message: "Fout bij herstel metafields: " + updateResult.data.productUpdate.userErrors.map((e: any) => e.message).join(", "),
          errors: updateResult.data.productUpdate.userErrors 
        }, { status: 400 });
      }
      
      return json({ 
        success: true, 
        message: "Metafields succesvol hersteld!" 
      });
      
    } catch (error) {
      console.error("Unexpected error in repairMetafields:", error);
      return json({ 
        success: false, 
        message: "Onverwachte fout bij herstel: " + (error instanceof Error ? error.message : String(error))
      }, { status: 500 });
    }
  }
  if (intent === "unlinkProduct") {
    const productId = formData.get("productId") as string;
    
    console.log("Unlink product data:", { productId });
    
    try {
      // Get current product to remove gifting tag
      const currentProductResponse = await admin.graphql(
        `#graphql
          query getProduct($id: ID!) {
            product(id: $id) {
              id
              tags
            }
          }
        `,
        { variables: { id: productId } }
      );
      
      // Try to parse as JSON regardless of content-type since Shopify GraphQL API returns text/plain
      let currentProduct;
      try {
        currentProduct = await currentProductResponse.json();
      } catch (error) {
        const errorText = await currentProductResponse.text();
        console.error("GraphQL response is not valid JSON:", errorText);
        return json({ 
          success: false, 
          message: "GraphQL service niet beschikbaar",
          error: "Invalid JSON response"
        }, { status: 500 });
      }
      console.log("Current product for unlinking:", currentProduct);
      
      if ((currentProduct as any).errors) {
        console.error("GraphQL errors:", (currentProduct as any).errors);
        return json({ 
          success: false, 
          message: "Product niet gevonden",
          errors: (currentProduct as any).errors 
        }, { status: 404 });
      }
      
      const currentTags = currentProduct.data?.product?.tags || [];
      // Remove the gifting tag
      const newTags = currentTags.filter((tag: string) => tag !== GIFTING_TAG);
      
      console.log("Removing gifting tag and metafields:", { productId, currentTags, newTags });
      
      // Remove metafields by setting them to null
      const metafields = [
        {
          namespace: "simple_gifting",
          key: "product_type",
          type: "single_line_text_field",
          value: null,
        },
        {
          namespace: "simple_gifting", 
          key: "max_chars",
          type: "number_integer",
          value: null,
        },
        {
          namespace: "simple_gifting",
          key: "customizable",
          type: "boolean",
          value: null,
        },
        {
          namespace: "simple_gifting",
          key: "ribbon_length",
          type: "number_integer",
          value: null,
        }
      ];
      
      // Update product to remove tags and metafields
      const updateResponse = await admin.graphql(
        `#graphql
          mutation updateProduct($input: ProductInput!) {
            productUpdate(input: $input) {
              product {
                id
                title
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
      
      // Try to parse as JSON regardless of content-type since Shopify GraphQL API returns text/plain
      let updateResult;
      try {
        updateResult = await updateResponse.json();
      } catch (error) {
        const errorText = await updateResponse.text();
        console.error("GraphQL unlink update response is not valid JSON:", errorText);
        return json({ 
          success: false, 
          message: "GraphQL service niet beschikbaar bij ontkoppelen",
          error: "Invalid JSON response"
        }, { status: 500 });
      }
      console.log("Unlink update result:", updateResult);
      
      if ((updateResult as any).errors) {
        console.error("GraphQL update errors:", (updateResult as any).errors);
        return json({ 
          success: false, 
          message: "GraphQL fout bij ontkoppelen product",
          errors: (updateResult as any).errors 
        }, { status: 500 });
      }
      
      if (updateResult.data?.productUpdate?.userErrors?.length > 0) {
        console.error("Product update user errors:", updateResult.data.productUpdate.userErrors);
        return json({ 
          success: false, 
          message: "Fout bij ontkoppelen product: " + updateResult.data.productUpdate.userErrors.map((e: any) => e.message).join(", "),
          errors: updateResult.data.productUpdate.userErrors 
        }, { status: 400 });
      }
      
      return json({ 
        success: true, 
        message: "Product succesvol ontkoppeld van gifting systeem!" 
      });
      
    } catch (error) {
      console.error("Unexpected error in unlinkProduct:", error);
      return json({ 
        success: false, 
        message: "Onverwachte fout: " + (error instanceof Error ? error.message : String(error))
      }, { status: 500 });
    }
  }
  return json({ success: false, message: "Onbekende actie" }, { status: 400 });
};

export default function GiftingProductsIndex() {
  const { products, existingProducts, search, status, shop } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher<typeof action>();
  
  const [searchValue, setSearchValue] = useState(search);
  const [statusFilter, setStatusFilter] = useState(status);
  const [customizableFilter, setCustomizableFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // Link existing product modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedExistingProduct, setSelectedExistingProduct] = useState<ExistingProduct | null>(null);
  const [linkProductForm, setLinkProductForm] = useState({
    giftingType: 'card',
    maxChars: '150',
    ribbonLength: '100',
    customizable: true
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Unlink product modal state
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [productToUnlink, setProductToUnlink] = useState<ProductNode | null>(null);

  // Check fetcher state to show toast messages and close modals
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const data = fetcher.data;
      if (data.success) {
        setToastMessage(data.message);
        setShowLinkModal(false);
        setShowUnlinkModal(false);
        setSelectedExistingProduct(null);
        setProductToUnlink(null);
      } else {
        setToastMessage(data.message || "Er is een fout opgetreden.");
      }
    }
  }, [fetcher.state, fetcher.data]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    
    const params = new URLSearchParams();
    params.set("search", value);
    if (statusFilter !== "all") params.set("status", statusFilter);
    
    navigate(`/app/cards?${params.toString()}`);
  }, [navigate, statusFilter]);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    
    const params = new URLSearchParams();
    params.set("search", searchValue);
    if (value !== "all") params.set("status", value);
    
    navigate(`/app/cards?${params.toString()}`);
  }, [navigate, searchValue]);

  const handleClearFilters = useCallback(() => {
    setSearchValue("");
    setStatusFilter("all");
    setCustomizableFilter([]);
    navigate(`/app/cards?search=${searchValue}`);
  }, [navigate, searchValue]);

  const handleLinkProduct = useCallback((product: ExistingProduct) => {
    setSelectedExistingProduct(product);
    setShowLinkModal(true);
  }, []);

  const handleCloseLinkModal = useCallback(() => {
    setShowLinkModal(false);
    setSelectedExistingProduct(null);
    setLinkProductForm({
      giftingType: 'card',
      maxChars: '150',
      ribbonLength: '100',
      customizable: true
    });
  }, []);

  const handleUnlinkProduct = useCallback((product: ProductNode) => {
    setProductToUnlink(product);
    setShowUnlinkModal(true);
  }, []);

  const handleCloseUnlinkModal = useCallback(() => {
    setShowUnlinkModal(false);
    setProductToUnlink(null);
  }, []);

  const createNewProduct = () => {
    const shopName = shop.replace('.myshopify.com', '');
    const adminUrl = `https://admin.shopify.com/store/${shopName}/products/new?tags=${GIFTING_TAG}`;
    window.open(adminUrl, '_blank');
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    if (customizableFilter.length > 0) {
      filtered = filtered.filter((product: ProductNode) => {
        const isCustomizable = product.customizable?.value === 'true';
        return customizableFilter.includes(isCustomizable ? 'true' : 'false');
      });
    }
    
    return filtered;
  }, [products, customizableFilter]);

  const productStats = useMemo(() => {
    const total = filteredProducts.length;
    const active = filteredProducts.filter((p: ProductNode) => p.status === 'ACTIVE').length;
    const customizable = filteredProducts.filter((p: ProductNode) => p.customizable?.value === 'true').length;
    const cards = filteredProducts.filter((p: ProductNode) => p.productType?.value === 'card').length;
    const ribbons = filteredProducts.filter((p: ProductNode) => p.productType?.value === 'ribbon').length;
    
    return { total, active, customizable, cards, ribbons };
  }, [filteredProducts]);

  const isSubmitting = navigation.state === "submitting";

  const rowMarkup = filteredProducts.map((product: ProductNode) => {
    const productType = product.productType?.value || 'Onbekend';
    const maxChars = product.maxChars?.value || '-';
    const ribbonLength = product.ribbonLength?.value || '-';
    const customizable = product.customizable?.value === 'true' ? 'Ja' : 'Nee';
    
    // Debug: Check if metafields are missing
    const hasMetafields = (product.productType?.value !== undefined && product.productType?.value !== null) || 
                         (product.maxChars?.value !== undefined && product.maxChars?.value !== null) || 
                         (product.customizable?.value !== undefined && product.customizable?.value !== null);
    const needsSetup = !hasMetafields;

    return [
      // Product column with better alignment
      <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
        <Icon source={productType === 'card' ? GiftCardIcon : ProductIcon} tone="base" />
        <div style={{ flex: 1 }}>
          <Text as="span" variant="bodyMd" fontWeight="medium">{product.title}</Text>
          {needsSetup && (
            <div style={{ marginTop: '4px' }}>
              <Badge tone="warning" size="small">Vereist setup</Badge>
            </div>
          )}
        </div>
      </div>,
      // Type column
      <div key={`type-${product.id}`} style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Badge tone={needsSetup ? 'attention' : (productType === 'card' ? 'info' : 'success')}>
          {needsSetup ? 'Niet ingesteld' : (productType === 'card' ? 'Kaartje' : 'Lint')}
        </Badge>
      </div>,
      // Status column with proper alignment
      <div key={`status-${product.id}`} style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Badge tone={product.status === 'ACTIVE' ? 'success' : 'critical'}>
          {product.status === 'ACTIVE' ? 'Actief' : 'Inactief'}
        </Badge>
      </div>,
      // Inventory column
      <div key={`inventory-${product.id}`} style={{ textAlign: 'right' }}>
        <Text as="span" variant="bodyMd">
          {product.totalInventory || 0}
        </Text>
      </div>,
      // Customizable column with centered alignment
      <div key={`customizable-${product.id}`} style={{ display: 'flex', justifyContent: 'center' }}>
        <Badge tone={customizable === 'Ja' ? 'success' : 'attention'}>
          {customizable}
        </Badge>
      </div>,
      // Max chars column with centered text
      <div key={`chars-${product.id}`} style={{ textAlign: 'center' }}>
        <Text as="span" variant="bodyMd">
          {maxChars}
        </Text>
      </div>,
      // Ribbon length column with centered text
      <div key={`ribbon-${product.id}`} style={{ textAlign: 'center' }}>
        <Text as="span" variant="bodyMd">
          {productType === 'ribbon' ? `${ribbonLength}cm` : '-'}
        </Text>
      </div>,
      // Actions column
      <div key={`actions-${product.id}`} style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <ButtonGroup variant="segmented">
          {needsSetup ? (
            <Button
              icon={SettingsIcon}
              tone="critical"
              accessibilityLabel={`Setup ${product.title}`}
              url={`/app/cards/${product.id.replace('gid://shopify/Product/', '')}`}
            >
              Setup
            </Button>
          ) : (
            <Button
              icon={EditIcon}
              accessibilityLabel={`Bewerk ${product.title}`}
              url={`/app/cards/${product.id.replace('gid://shopify/Product/', '')}`}
            />
          )}
          <Button
            icon={DeleteIcon}
            tone="critical"
            accessibilityLabel={`Ontkoppel ${product.title}`}
            onClick={() => handleUnlinkProduct(product)}
          />
        </ButtonGroup>
      </div>,
    ];
  });

  const filters = [
    {
      key: 'customizable',
      label: 'Personaliseerbaar',
      filter: (
        <ChoiceList
          title="Personaliseerbaar"
          titleHidden
          choices={[
            { label: 'Ja', value: 'true' },
            { label: 'Nee', value: 'false' },
          ]}
          selected={customizableFilter}
          onChange={setCustomizableFilter}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters = [];
  if (customizableFilter.length > 0) {
    appliedFilters.push({
      key: 'customizable',
      label: `Personaliseerbaar: ${customizableFilter.map(f => f === 'true' ? 'Ja' : 'Nee').join(', ')}`,
      onRemove: () => setCustomizableFilter([]),
    });
  }

  return (
    <Frame>
      <Page 
        title="Gifting Producten"
        subtitle={`${productStats.total} producten gevonden`}
        primaryAction={{
          content: 'Nieuw gifting product',
          onAction: createNewProduct
        }}
        secondaryActions={[
          {
            content: 'Koppel bestaand product',
            icon: PlusIcon,
            onAction: () => setShowLinkModal(true)
          }
        ]}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">Gifting Producten</Text>
                  <InlineStack gap="200">
                    <Badge tone="info">{`${filteredProducts.length} producten`}</Badge>
                    {filteredProducts.length !== products.length && (
                      <Badge tone="attention">{`Gefilterd van ${products.length}`}</Badge>
                    )}
                  </InlineStack>
                </InlineStack>
                
                <InlineStack gap="400" align="start">
                  <div style={{ flex: 1 }}>
                    <TextField
                      label="Zoek in producten"
                      placeholder="Zoek op productnaam..."
                      value={searchValue}
                      onChange={handleSearchChange}
                      prefix={<Icon source={SearchIcon} tone="base" />}
                      clearButton
                      onClearButtonClick={() => handleSearchChange("")}
                      autoComplete="off"
                    />
                  </div>
                  
                  <Select
                    label="Status filter"
                    options={[
                      { label: "Alle statussen", value: "all" },
                      { label: "Alleen actieve", value: "active" },
                      { label: "Alleen inactieve", value: "draft" },
                    ]}
                    value={statusFilter}
                    onChange={handleStatusChange}
                  />
                  
                  <div style={{ paddingTop: '1.5rem' }}>
                    <Button
                      onClick={() => setShowFilters(!showFilters)}
                      icon={FilterIcon}
                      variant={showFilters ? "primary" : "secondary"}
                    >
                      {showFilters ? 'Verberg filters' : 'Meer filters'}
                    </Button>
                  </div>
                </InlineStack>

                {showFilters && (
                  <Card background="bg-surface-secondary">
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm">Geavanceerde filters</Text>
                      <Filters
                        queryValue={searchValue}
                        filters={filters}
                        appliedFilters={appliedFilters}
                        onQueryChange={handleSearchChange}
                        onQueryClear={() => handleSearchChange("")}
                        onClearAll={handleClearFilters}
                      />
                    </BlockStack>
                  </Card>
                )}
                
                {(searchValue || statusFilter !== "all" || appliedFilters.length > 0) && (
                  <InlineStack gap="200" align="start">
                    <Text as="p" variant="bodySm" tone="subdued">
                      {filteredProducts.length} van {products.length} producten gevonden
                    </Text>
                    <Button variant="plain" onClick={handleClearFilters}>
                      Alle filters wissen
                    </Button>
                  </InlineStack>
                )}
                
                <Divider />
                
                {productStats.total === 0 && (
                  <Banner tone="info">
                    <Text as="p">
                      Je hebt nog geen gifting producten. Klik op "Nieuw gifting product", "Koppel bestaand product" of "Filters wissen" om te beginnen.
                    </Text>
                  </Banner>
                )}
                
                <div style={{ padding: '1rem 0' }}>
                  {filteredProducts.length === 0 ? (
                    <EmptyState
                      heading={
                        search || statusFilter !== "all" || appliedFilters.length > 0
                          ? "No products found"
                          : "No gifting products yet"
                      }
                      action={{
                        content: search || statusFilter !== "all" || appliedFilters.length > 0
                          ? 'Clear filters'
                          : 'Create your first product',
                        onAction: search || statusFilter !== "all" || appliedFilters.length > 0
                          ? handleClearFilters 
                          : createNewProduct
                      }}
                      secondaryAction={
                        !(search || statusFilter !== "all" || appliedFilters.length > 0) && existingProducts.length > 0
                          ? {
                              content: 'Or link existing product',
                              onAction: () => setShowLinkModal(true)
                            }
                          : undefined
                      }
                      image="https://cdn.shopify.com/s/files/1/0533/2089/files/empty-state.svg"
                    >
                      <p>
                        {search || statusFilter !== "all" || appliedFilters.length > 0
                          ? "Try another search term or adjust your filters."
                          : "Create cards and ribbons that customers can personalize."
                        }
                      </p>
                    </EmptyState>
                  ) : (
                    <DataTable
                      columnContentTypes={['text', 'text', 'text', 'numeric', 'text', 'text', 'text', 'text']}
                      headings={['Product', 'Type', 'Status', 'Stock', 'Personaliseerbaar', 'Max tekens', 'Lint lengte', 'Acties']}
                      rows={rowMarkup}
                      sortable={[true, true, true, true, false, true, false, false]}
                    />
                  )}
                </div>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
        
        {/* Link Existing Product Modal */}
        <Modal
          open={showLinkModal}
          onClose={handleCloseLinkModal}
          title="Link Existing Product"
          primaryAction={{
            content: fetcher.state === 'submitting' ? 'Linking...' : 'Link Product',
            onAction: () => {
              if (selectedExistingProduct) {
                const formData = new FormData();
                formData.append("intent", "linkProduct");
                formData.append("productId", selectedExistingProduct.id);
                formData.append("giftingType", linkProductForm.giftingType);
                formData.append("maxChars", linkProductForm.maxChars);
                formData.append("ribbonLength", linkProductForm.ribbonLength);
                formData.append("customizable", linkProductForm.customizable.toString());
                fetcher.submit(formData, { method: "post" });
              }
            },
            loading: fetcher.state === 'submitting',
            disabled: !selectedExistingProduct
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: handleCloseLinkModal,
            },
          ]}
        >
          <Modal.Section>
            {!selectedExistingProduct ? (
              <BlockStack gap="400">
                <Text as="p" variant="bodyMd">
                  Select an existing product from your store to link to the gifting system. The product will automatically receive the correct personalization settings.
                </Text>
                {existingProducts.length === 0 ? (
                  <EmptyState
                    heading="All products are already linked"
                    image="https://cdn.shopify.com/s/files/1/0533/2089/files/empty-state.svg"
                  >
                    <p>All products in your store are already linked to the gifting system, or you do not have any products yet.</p>
                  </EmptyState>
                ) : (
                  <>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {existingProducts.length} available products
                    </Text>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e1e3e5', borderRadius: '8px', padding: '1rem' }}>
                      <BlockStack gap="200">
                        {existingProducts.map((product: ExistingProduct) => (
                          <Card key={product.id}>
                            <InlineStack align="space-between">
                              <InlineStack gap="300">
                                {product.featuredImage?.url && (
                                  <img 
                                    src={product.featuredImage.url} 
                                    alt={product.title}
                                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                  />
                                )}
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                                    {product.title}
                                  </Text>
                                  <InlineStack gap="200">
                                    <Badge tone={product.status === 'ACTIVE' ? 'success' : 'critical'}>
                                      {product.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <Text as="p" variant="bodySm" tone="subdued">
                                      Stock: {product.totalInventory || 0}
                                    </Text>
                                  </InlineStack>
                                </BlockStack>
                              </InlineStack>
                              <Button onClick={() => handleLinkProduct(product)}>
                                Select
                              </Button>
                            </InlineStack>
                          </Card>
                        ))}
                      </BlockStack>
                    </div>
                  </>
                )}
              </BlockStack>
            ) : (
              <BlockStack gap="400">
                <Card>
                  <InlineStack gap="300">
                    {selectedExistingProduct.featuredImage?.url && (
                      <img 
                        src={selectedExistingProduct.featuredImage.url} 
                        alt={selectedExistingProduct.title}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    )}
                    <BlockStack gap="100">
                      <Text as="p" variant="headingMd">
                        {selectedExistingProduct.title}
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Configure how this product works in the gifting system
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Card>
                <fetcher.Form method="post">
                  <input type="hidden" name="intent" value="linkProduct" />
                  <input type="hidden" name="productId" value={selectedExistingProduct.id} />
                  <input type="hidden" name="giftingType" value={linkProductForm.giftingType} />
                  <input type="hidden" name="maxChars" value={linkProductForm.maxChars} />
                  <input type="hidden" name="ribbonLength" value={linkProductForm.ribbonLength} />
                  <input type="hidden" name="customizable" value={linkProductForm.customizable.toString()} />
                </fetcher.Form>
                <FormLayout>
                  <Select
                    label="What type of gifting product is this?"
                    options={[
                      { label: 'Card (for messages)', value: 'card' },
                      { label: 'Ribbon (for gifts)', value: 'ribbon' },
                    ]}
                    value={linkProductForm.giftingType}
                    onChange={(value) => setLinkProductForm(prev => ({ ...prev, giftingType: value }))}
                    helpText="Choose the type that best fits this product"
                  />
                  <TextField
                    label="Maximum number of characters"
                    type="number"
                    value={linkProductForm.maxChars}
                    onChange={(value) => setLinkProductForm(prev => ({ ...prev, maxChars: value }))}
                    helpText="How many characters can customers enter at most?"
                    autoComplete="off"
                  />
                  {linkProductForm.giftingType === 'ribbon' && (
                    <TextField
                      label="Ribbon length (cm)"
                      type="number"
                      value={linkProductForm.ribbonLength}
                      onChange={(value) => setLinkProductForm(prev => ({ ...prev, ribbonLength: value }))}
                      helpText="How long is this ribbon in centimeters?"
                      autoComplete="off"
                    />
                  )}
                  <Checkbox
                    label="Customers can personalize this product"
                    checked={linkProductForm.customizable}
                    onChange={(checked) => setLinkProductForm(prev => ({ ...prev, customizable: checked }))}
                    helpText="Can customers add their own text to this product?"
                  />
                </FormLayout>
                <Button 
                  variant="plain" 
                  onClick={() => setSelectedExistingProduct(null)}
                >
                  ← Choose another product
                </Button>
              </BlockStack>
            )}
          </Modal.Section>
        </Modal>

        {/* Unlink Product Confirmation Modal */}
        <Modal
          open={showUnlinkModal}
          onClose={handleCloseUnlinkModal}
          title="Unlink Product"
          primaryAction={{
            content: fetcher.state === 'submitting' ? 'Unlinking...' : 'Unlink Product',
            onAction: () => {
              if (productToUnlink) {
                const formData = new FormData();
                formData.append("intent", "unlinkProduct");
                formData.append("productId", productToUnlink.id);
                fetcher.submit(formData, { method: "post" });
              }
            },
            loading: fetcher.state === 'submitting',
            disabled: !productToUnlink,
            destructive: true
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: handleCloseUnlinkModal,
            },
          ]}
        >
          <Modal.Section>
            {productToUnlink && (
              <BlockStack gap="400">
                <Text as="p" variant="bodyMd">
                  Are you sure you want to unlink <strong>{productToUnlink.title}</strong> from the gifting system?
                </Text>
                <fetcher.Form method="post">
                  <input type="hidden" name="intent" value="unlinkProduct" />
                  <input type="hidden" name="productId" value={productToUnlink.id} />
                </fetcher.Form>
                <Banner tone="warning">
                  <Text as="p" variant="bodyMd">
                    This will perform the following actions:
                  </Text>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                    <li>The "simple-gifting-product" tag will be removed</li>
                    <li>All personalization settings will be cleared</li>
                    <li>The product will no longer appear in the gifting products list</li>
                    <li>Customers will no longer be able to personalize this product</li>
                  </ul>
                </Banner>
                <Text as="p" variant="bodyMd" tone="subdued">
                  This action can be undone by linking the product again.
                </Text>
              </BlockStack>
            )}
          </Modal.Section>
        </Modal>
      </Page>
      
      {/* Toast for feedback - now inside Frame */}
      {toastMessage && (
        <Toast
          content={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </Frame>
  );
}