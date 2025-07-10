import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Badge,
  Grid,
  Icon,
  Divider,
  List,
  Banner,
  CalloutCard,
} from "@shopify/polaris";
import { 
  GiftCardIcon, 
  SettingsIcon, 
  CheckCircleIcon,
  AlertCircleIcon,
  ProductIcon
} from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getShopConfiguration } from "../models/ShopConfiguration.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  try {
    // Get shop configuration
    const config = await getShopConfiguration(shop);

    // Get product statistics
    const productsResponse = await admin.graphql(
      `#graphql
        query getDashboardStats {
          products(first: 1) {
            edges {
              node {
                id
              }
            }
          }
          metafieldDefinitions(first: 10, ownerType: PRODUCT, namespace: "simple_gifting") {
            edges {
              node {
                id
              }
            }
          }
        }
      `
    );

    const responseJson = await productsResponse.json();
    if (!responseJson.data) {
      throw new Error("Failed to fetch dashboard stats.");
    }
    const data = responseJson.data;

    const products = data.products.edges;
    const metafields = data.metafieldDefinitions.edges;

    const stats = {
      totalProducts: products.length,
      metafieldsConfigured: metafields.length,
    };

    return json({ config, stats, shop, error: null });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    return json({
      config: { appIsEnabled: false }, // Default safe config
      stats: { totalProducts: 0, metafieldsConfigured: 0 },
      shop,
      error: "Er was een probleem bij het laden van het dashboard. Probeer het opnieuw."
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "initialize") {
    const results = [];
    
    // Create all metafield definitions
    for (const definition of METAFIELD_DEFINITIONS) {
      const response = await admin.graphql(
        `#graphql
          mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
            metafieldDefinitionCreate(definition: $definition) {
              createdDefinition {
                id
                name
                namespace
                key
              }
              userErrors {
                field
                message
              }
            }
          }`,
        {
          variables: {
            definition: {
              name: definition.name,
              namespace: definition.namespace,
              key: definition.key,
              type: definition.type,
              description: definition.description,
              ownerType: definition.ownerType,
            },
          },
        },
      );

      const responseJson = await response.json();
      const result = responseJson.data.metafieldDefinitionCreate;
      
      if (result.userErrors.length > 0) {
        console.error(`Metafield definition creation failed for ${definition.key}:`, result.userErrors);
      }
      
      results.push({
        key: definition.key,
        success: result.createdDefinition !== null,
        errors: result.userErrors,
      });
    }

    const allSuccessful = results.every(r => r.success);
    const allErrors = results.flatMap(r => r.errors);

    return json({
      success: allSuccessful,
      results,
      errors: allErrors,
    });
  }

  return json({ success: false });
};

const METAFIELD_DEFINITIONS = [
  {
    namespace: "simple_gifting",
    key: "max_chars",
    name: "Maximum Characters",
    description: "Maximum number of characters allowed for personalization",
    type: "number_integer",
    ownerType: "PRODUCT"
  },
  {
    namespace: "simple_gifting", 
    key: "product_type",
    name: "Gifting Product Type",
    description: "Type of gifting product: card or ribbon",
    type: "single_line_text_field",
    ownerType: "PRODUCT"
  },
  {
    namespace: "simple_gifting",
    key: "ribbon_length", 
    name: "Ribbon Length",
    description: "Length of ribbon in centimeters",
    type: "number_integer",
    ownerType: "PRODUCT"
  },
  {
    namespace: "simple_gifting",
    key: "customizable",
    name: "Customizable",
    description: "Whether this product can be personalized",
    type: "boolean",
    ownerType: "PRODUCT"
  }
];

export default function Dashboard() {
  const { config, stats, shop, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();

  const handleInitialize = () => {
    const formData = new FormData();
    formData.append("action", "initialize");
    submit(formData, { method: "post" });
  };

  const isConfigured = stats.metafieldsConfigured >= 4;
  
  if (error) {
    return (
      <Page>
        <Layout.Section>
          <Banner title="Fout" tone="critical">
            <p>{error}</p>
          </Banner>
        </Layout.Section>
      </Page>
    );
  }

  return (
    <Page title="Welkom bij Simple Gifting">
      <TitleBar title="Simple Gifting" />
      
      <Layout>
        <Layout.Section>
          <CalloutCard
            title="Aan de slag met Simple Gifting"
            illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customize-card-background-shape-for-checkout-step-1-53C49A5868B34C4F25BE06F19A0AB2A6.svg"
            primaryAction={{
              content: isConfigured ? "Producten Bekijken" : "Start configuratie",
              onAction: isConfigured ? () => navigate("/app/cards") : handleInitialize
            }}
          >
            <BlockStack gap="200">
              <Text as="p">
                Welkom! Volg deze stappen om je winkel klaar te maken voor gepersonaliseerde cadeaus.
              </Text>
              <List>
                <List.Item>
                  <InlineStack gap="200" blockAlign="center">
                    {isConfigured ? <Icon source={CheckCircleIcon} tone="success" /> : <Icon source={AlertCircleIcon} tone="warning" />}
                    <Text as="span">Stap 1: App configuratie</Text>
                    {isConfigured && <Badge tone="success">Voltooid</Badge>}
                  </InlineStack>
                </List.Item>
                <List.Item>
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={ProductIcon} tone="base" />
                    <Text as="span">Stap 2: Producten toevoegen en personaliseren</Text>
                  </InlineStack>
                </List.Item>
              </List>
            </BlockStack>
          </CalloutCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
