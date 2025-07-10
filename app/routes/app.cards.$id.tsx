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
        backAction={{ content: "Cadeaukaarten", onAction: () => navigate("/app/cards") }}
        title="Nieuw product aanmaken"
      >
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <Text as="p" variant="bodyMd">
                  Je wordt doorgestuurd naar de Shopify product editor om een nieuw product aan te maken.
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
      backAction={{ content: "Cadeaukaarten", onAction: () => navigate("/app/cards") }}
      title={`Instellingen voor: ${product.title}`}
      primaryAction={{
        content: "Bewerk in Shopify",
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
                    { label: "Kaartje", value: "card" },
                    { label: "Lint", value: "ribbon" }
                  ]}
                  value={formState.productType}
                  onChange={(value) => handleInputChange(value, "productType")}
                />
                
                <TextField
                  label="Maximaal aantal tekens voor bericht"
                  type="number"
                  value={formState.maxChars}
                  onChange={(value) => handleInputChange(value, "maxChars")}
                  helpText="Stel het maximale aantal tekens in dat een klant mag invoeren."
                  autoComplete="off"
                  requiredIndicator
                />

                {formState.productType === "ribbon" && (
                  <TextField
                    label="Lint lengte (cm)"
                    type="number"
                    value={formState.ribbonLength}
                    onChange={(value) => handleInputChange(value, "ribbonLength")}
                    helpText="Lengte van het lint in centimeters."
                    autoComplete="off"
                    requiredIndicator
                  />
                )}

                <Select
                  label="Personaliseerbaar"
                  options={[
                    { label: "Ja", value: "true" },
                    { label: "Nee", value: "false" }
                  ]}
                  value={formState.customizable}
                  onChange={(value) => handleInputChange(value, "customizable")}
                  helpText="Kan dit product gepersonaliseerd worden door klanten?"
                />
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <PageActions
              primaryAction={{
                content: "Opslaan",
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