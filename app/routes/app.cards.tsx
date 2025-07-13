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
              }
              maxChars: metafield(namespace: "simple_gifting", key: "max_chars") {
                value
              }
              ribbonLength: metafield(namespace: "simple_gifting", key: "ribbon_length") {
                value
              }
              customizable: metafield(namespace: "simple_gifting", key: "customizable") {
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
          message: "GraphQL service not available",
          error: "Invalid JSON response"
        }, { status: 500 });
      }
      console.log("Current product response:", currentProduct);
      
      if ((currentProduct as any).errors) {
        console.error("GraphQL errors:", (currentProduct as any).errors);
        return json({ 
          success: false, 
          message: "Product not found",
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
          message: "GraphQL service not available during update",
          error: "Invalid JSON response"
        }, { status: 500 });
      }
      console.log("Update result:", updateResult);
      
      if ((updateResult as any).errors) {
        console.error("GraphQL update errors:", (updateResult as any).errors);
        return json({ 
          success: false, 
          message: "GraphQL error when updating product",
          errors: (updateResult as any).errors 
        }, { status: 500 });
      }
      
      if (updateResult.data?.productUpdate?.userErrors?.length > 0) {
        console.error("Product update user errors:", updateResult.data.productUpdate.userErrors);
        return json({ 
          success: false, 
          message: "Error updating product: " + updateResult.data.productUpdate.userErrors.map((e: any) => e.message).join(", "),
          errors: updateResult.data.productUpdate.userErrors 
        }, { status: 400 });
      }
      
      return json({ 
        success: true, 
        message: "Product successfully linked to gifting system!" 
      });
      
    } catch (error) {
      console.error("Unexpected error in linkProduct:", error);
      return json({ 
        success: false, 
        message: "Unexpected error: " + (error instanceof Error ? error.message : String(error))
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
          message: "GraphQL service not available",
          error: "Invalid JSON response"
        }, { status: 500 });
      }
      console.log("Current product for unlinking:", currentProduct);
      
      if ((currentProduct as any).errors) {
        console.error("GraphQL errors:", (currentProduct as any).errors);
        return json({ 
          success: false, 
          message: "Product not found",
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
          message: "GraphQL service not available when unlinking",
          error: "Invalid JSON response"
        }, { status: 500 });
      }
      console.log("Unlink update result:", updateResult);
      
      if ((updateResult as any).errors) {
        console.error("GraphQL update errors:", (updateResult as any).errors);
        return json({ 
          success: false, 
          message: "GraphQL error when unlinking product",
          errors: (updateResult as any).errors 
        }, { status: 500 });
      }
      
      if (updateResult.data?.productUpdate?.userErrors?.length > 0) {
        console.error("Product update user errors:", updateResult.data.productUpdate.userErrors);
        return json({ 
          success: false, 
          message: "Error when unlinking product: " + updateResult.data.productUpdate.userErrors.map((e: any) => e.message).join(", "),
          errors: updateResult.data.productUpdate.userErrors 
        }, { status: 400 });
      }
      
      return json({ 
        success: true, 
        message: "Product successfully unlinked from gifting system!" 
      });
      
    } catch (error) {
      console.error("Unexpected error in unlinkProduct:", error);
      return json({ 
        success: false, 
        message: "Unexpected error: " + (error instanceof Error ? error.message : String(error))
      }, { status: 500 });
    }
  }
  
  return json({ success: false, message: "Unknown action" }, { status: 400 });
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
        setToastMessage(data.message || "An error occurred.");
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
    const productType = product.productType?.value || 'Unknown';
    const maxChars = product.maxChars?.value || '-';
    const ribbonLength = product.ribbonLength?.value || '-';
    const customizable = product.customizable?.value === 'true' ? 'Yes' : 'No';

    return [
      // Product column with better alignment
      <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
        <Icon source={productType === 'card' ? GiftCardIcon : ProductIcon} tone="base" />
        <div style={{ flex: 1 }}>
          <Text as="span" variant="bodyMd" fontWeight="medium">{product.title}</Text>
        </div>
      </div>,
      // Type column
      <div key={`type-${product.id}`} style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Badge tone={productType === 'card' ? 'info' : 'success'}>
          {productType === 'card' ? 'Card' : 'Ribbon'}
        </Badge>
      </div>,
      // Status column with proper alignment
      <div key={`status-${product.id}`} style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Badge tone={product.status === 'ACTIVE' ? 'success' : 'critical'}>
          {product.status === 'ACTIVE' ? 'Active' : 'Inactive'}
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
        <Badge tone={customizable === 'Yes' ? 'success' : 'attention'}>
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
          {/* Removed edit and unlink buttons that link to other pages */}
        </ButtonGroup>
      </div>,
    ];
  });

  const filters = [
    {
      key: 'customizable',
      label: 'Customizable',
      filter: (
        <ChoiceList
          title="Customizable"
          titleHidden
          choices={[
            { label: 'Yes', value: 'true' },
            { label: 'No', value: 'false' },
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
      label: `Customizable: ${customizableFilter.map(f => f === 'true' ? 'Yes' : 'No').join(', ')}`,
      onRemove: () => setCustomizableFilter([]),
    });
  }

  return (
    <Frame>
      <Page 
        title="Gifting Products"
        subtitle={`${productStats.total} products found`}
        primaryAction={{
          content: 'New gifting product',
          onAction: createNewProduct
        }}
        secondaryActions={[]}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">Overview</Text>
                  <Badge tone="info">{`${filteredProducts.length} products`}</Badge>
                </InlineStack>
                
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                    <InlineStack align="center" gap="200">
                      <Icon source={ProductIcon} tone="base" />
                      <BlockStack gap="050">
                        <Text as="p" variant="headingMd">{productStats.total}</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">Total products</Text>
                      </BlockStack>
                    </InlineStack>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                    <InlineStack align="center" gap="200">
                      <Icon source={GiftCardIcon} tone="success" />
                      <BlockStack gap="050">
                        <Text as="p" variant="headingMd">{productStats.active}</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">Active products</Text>
                      </BlockStack>
                    </InlineStack>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                    <InlineStack align="center" gap="200">
                      <Icon source={SettingsIcon} tone="warning" />
                      <BlockStack gap="050">
                        <Text as="p" variant="headingMd">{productStats.customizable}</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">Customizable</Text>
                      </BlockStack>
                    </InlineStack>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                    <InlineStack align="center" gap="200">
                      <Icon source={FilterIcon} tone="base" />
                      <BlockStack gap="050">
                        <Text as="p" variant="headingMd">{productStats.cards} / {productStats.ribbons}</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">Cards / Ribbons</Text>
                      </BlockStack>
                    </InlineStack>
                  </Grid.Cell>
                </Grid>
                
                {productStats.total === 0 && (
                  <Banner tone="info">
                    <Text as="p">
                      You don't have any gifting products yet. Click "New gifting product", "Link existing product" or "Clear filters" to get started.
                    </Text>
                  </Banner>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Search & Filter</Text>
                
                <InlineStack gap="400" align="start">
                  <div style={{ flex: 1 }}>
                    <TextField
                      label="Search products"
                      placeholder="Search by product name..."
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
                      { label: "All statuses", value: "all" },
                      { label: "Only active", value: "active" },
                      { label: "Only inactive", value: "draft" },
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
                      {showFilters ? 'Hide filters' : 'More filters'}
                    </Button>
                  </div>
                </InlineStack>

                {showFilters && (
                  <Card background="bg-surface-secondary">
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm">Advanced filters</Text>
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
                      {filteredProducts.length} of {products.length} products found
                    </Text>
                    <Button variant="plain" onClick={handleClearFilters}>
                      Clear all filters
                    </Button>
                  </InlineStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">Products</Text>
                  <InlineStack gap="200">
                    <Badge tone="info">{`${filteredProducts.length} products`}</Badge>
                    {filteredProducts.length !== products.length && (
                      <Badge tone="attention">{`Filtered from ${products.length}`}</Badge>
                    )}
                  </InlineStack>
                </InlineStack>
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
                      headings={['Product', 'Type', 'Status', 'Stock', 'Customizable', 'Max Chars', 'Ribbon Length', 'Actions']}
                      rows={rowMarkup}
                      sortable={[true, true, true, true, true, false, false, false]}
                    />
                  )}
                </div>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
        
        {/* Link Existing Product Modal */}
        {/* Removed modal for linking existing products */}
        
        {/* Unlink Product Confirmation Modal */}
        {/* Removed modal for unlinking products */}
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