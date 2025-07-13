import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
  useParams,
  Form,
} from "@remix-run/react";
import {
  Card,
  Button,
  BlockStack,
  Page,
  Layout,
  Text,
  TextField,
  Select,
  PageActions,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";

const METAFIELD_NAMESPACE = "simple_gifting";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  if (params.id === "new") {
    return json({
      product: null,
      isNew: true,
      shop: session.shop
    });
  }

  const productId = `gid://shopify/Product/${params.id}`;

  const response = await admin.graphql(
    `#graphql
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          status
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
      }`,
    { variables: { id: productId } }
  );

  const responseJson = await response.json();
  const product = responseJson.data.product;

  if (!product) {
    throw new Response("Not Found", { status: 404 });
  }
  
  return json({ product, isNew: false, shop: session.shop });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  if (params.id === "new") {
    // Redirect to Shopify admin for new product creation
    return redirect("/admin/products/new");
  }

  const productId = `gid://shopify/Product/${params.id}`;
  
  const formData = await request.formData();
  const maxChars = formData.get("maxChars") as string;
  const productType = formData.get("productType") as string;
  const ribbonLength = formData.get("ribbonLength") as string;
  const customizable = formData.get("customizable") as string;

  const metafields = [
    {
      namespace: METAFIELD_NAMESPACE,
      key: "max_chars",
      type: "number_integer",
      value: maxChars,
    },
    {
      namespace: METAFIELD_NAMESPACE,
      key: "product_type", 
      type: "single_line_text_field",
      value: productType,
    },
    {
      namespace: METAFIELD_NAMESPACE,
      key: "customizable",
      type: "boolean",
      value: customizable,
    }
  ];

  // Add ribbon length if it's a ribbon product
  if (productType === "ribbon" && ribbonLength) {
    metafields.push({
      namespace: METAFIELD_NAMESPACE,
      key: "ribbon_length",
      type: "number_integer", 
      value: ribbonLength,
    });
  }

  const response = await admin.graphql(
    `#graphql
      mutation updateProductMetafields($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
          }
          userErrors {
            field
            message
          }
        }
      }`,
    {
      variables: {
        input: {
          id: productId,
          metafields,
        },
      },
    }
  );

  const responseJson = await response.json();
  if (responseJson.data.productUpdate.userErrors.length > 0) {
    return json({ errors: responseJson.data.productUpdate.userErrors }, { status: 400 });
  }

  return redirect(`/app/cards`);
};

export default function ProductMetafieldForm() {
  const { product, isNew, shop } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const submit = useSubmit();
  const params = useParams();

  const [formState, setFormState] = useState({
    maxChars: product?.maxChars?.value || "150",
    productType: product?.productType?.value || "card",
    ribbonLength: product?.ribbonLength?.value || "100",
    customizable: product?.customizable?.value === "true" ? "true" : "false"
  });

  const isSaving = navigation.state === "submitting";

  const handleInputChange = useCallback(
    (value: string, name: string) => {
      setFormState((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSave = () => {
    const formData = new FormData();
    formData.append("maxChars", formState.maxChars);
    formData.append("productType", formState.productType);
    formData.append("ribbonLength", formState.ribbonLength);
    formData.append("customizable", formState.customizable);
    submit(formData, { method: "post" });
  };

  if (isNew) {
    return (
      <Page
        backAction={{ content: "Gift Cards", onAction: () => navigate("/app/cards") }}
        title="Create New Product"
      >
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <Text as="p" variant="bodyMd">
                  You will be redirected to the Shopify product editor to create a new product.
                </Text>
                <Button
                  variant="primary"
                  onClick={() => {
                    const shopName = shop.replace('.myshopify.com', '');
                    window.open(`https://admin.shopify.com/store/${shopName}/products/new`, "_blank");
                  }}
                >
                  Open Product Editor
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      backAction={{ content: "Gift Cards", onAction: () => navigate("/app/cards") }}
      title={`Settings for: ${product.title}`}
      primaryAction={{
        content: "Edit in Shopify",
        onAction: () => {
          const shopName = shop.replace('.myshopify.com', '');
          window.open(`https://admin.shopify.com/store/${shopName}/products/${params.id}`, "_blank");
        }
      }}
    >
      <Form onSubmit={handleSave}>
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <Select
                  label="Product Type"
                  options={[
                    { label: "Card", value: "card" },
                    { label: "Ribbon", value: "ribbon" }
                  ]}
                  value={formState.productType}
                  onChange={(value) => handleInputChange(value, "productType")}
                />
                
                <TextField
                  label="Maximum number of characters for message"
                  type="number"
                  value={formState.maxChars}
                  onChange={(value) => handleInputChange(value, "maxChars")}
                  helpText="Set the maximum number of characters a customer can enter."
                  autoComplete="off"
                  requiredIndicator
                />

                {formState.productType === "ribbon" && (
                  <TextField
                    label="Ribbon length (cm)"
                    type="number"
                    value={formState.ribbonLength}
                    onChange={(value) => handleInputChange(value, "ribbonLength")}
                    helpText="Length of the ribbon in centimeters."
                    autoComplete="off"
                    requiredIndicator
                  />
                )}

                <Select
                  label="Customizable"
                  options={[
                    { label: "Yes", value: "true" },
                    { label: "No", value: "false" }
                  ]}
                  value={formState.customizable}
                  onChange={(value) => handleInputChange(value, "customizable")}
                  helpText="Can this product be personalized by customers?"
                />
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <PageActions
              primaryAction={{
                content: "Save",
                loading: isSaving,
                onAction: handleSave,
              }}
            />
          </Layout.Section>
        </Layout>
      </Form>
    </Page>
  );
}