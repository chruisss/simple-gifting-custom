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
  
  // Get shop configuration
  const config = await getShopConfiguration(shop);
  
  // Get product statistics
  const productsResponse = await admin.graphql(
    `#graphql
      query getDashboardStats {
        products(first: 250, query: "tag:simple-gifting-product") {
          edges {
            node {
              id
              status
              totalInventory
              customizable: metafield(namespace: "simple_gifting", key: "customizable") {
                value
              }
            }
          }
        }
        metafieldDefinitions(first: 10, ownerType: PRODUCT, namespace: "simple_gifting") {
          edges {
            node {
              id
              key
              name
            }
          }
        }
      }
    `
  );

  const responseJson = await productsResponse.json();
  const data = responseJson.data;
  
  const products = data.products.edges.map((edge: any) => edge.node);
  const metafields = data.metafieldDefinitions.edges.map((edge: any) => edge.node);
  
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter((p: any) => p.status === 'ACTIVE').length,
    customizableProducts: products.filter((p: any) => p.customizable?.value === 'true').length,
    totalInventory: products.reduce((sum: number, p: any) => sum + (p.totalInventory || 0), 0),
    metafieldsConfigured: metafields.length,
    appEnabled: config.appIsEnabled
  };

  return json({ config, stats, shop });
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
  const { config, stats, shop } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();

  const handleInitialize = () => {
    const formData = new FormData();
    formData.append("action", "initialize");
    submit(formData, { method: "post" });
  };

  const isConfigured = stats.metafieldsConfigured >= 4;
  const hasProducts = stats.totalProducts > 0;

  return (
    <Page title="Dashboard">
      <TitleBar title="Simple Gifting - Dashboard" />
      
      {!isConfigured && (
        <Layout.Section>
          <Banner
            title="Eerste configuratie vereist"
            tone="warning"
            action={{
              content: "Configureer nu",
              onAction: handleInitialize
            }}
          >
            <p>Voordat je de app kunt gebruiken, moeten de product metafields worden geïnitialiseerd.</p>
          </Banner>
        </Layout.Section>
      )}

      <Layout>
        <Layout.Section>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="h3" variant="headingMd">App Status</Text>
                    <Badge tone={config.appIsEnabled ? "success" : "critical"}>
                      {config.appIsEnabled ? "Actief" : "Inactief"}
                    </Badge>
                  </InlineStack>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {config.appIsEnabled 
                      ? "De app is actief en klanten kunnen producten personaliseren"
                      : "De app is uitgeschakeld voor klanten"
                    }
                  </Text>
                  <Button onClick={() => navigate("/app/settings")}>
                    Instellingen aanpassen
                  </Button>
                </BlockStack>
              </Card>
            </Grid.Cell>
            
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="h3" variant="headingMd">Configuratie Status</Text>
                    <Badge tone={isConfigured ? "success" : "warning"}>
                      {isConfigured ? "Voltooid" : "Onvolledig"}
                    </Badge>
                  </InlineStack>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {isConfigured 
                      ? "Alle metafields zijn correct geïnstalleerd"
                      : `${stats.metafieldsConfigured} van de 4 benodigde metafields zijn gevonden`
                    }
                  </Text>
                  {!isConfigured && (
                    <Button onClick={handleInitialize}>
                      Start configuratie
                    </Button>
                  )}
                  {isConfigured && (
                     <Text as="p" tone="subdued">
                      Alles is up-to-date
                    </Text>
                  )}
                </BlockStack>
              </Card>
            </Grid.Cell>
          </Grid>
        </Layout.Section>
        
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Product Overzicht</Text>
              
              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack>
                    <Text as="p" variant="bodyMd" tone="subdued">Totaal producten</Text>
                    <Text as="p" variant="headingLg">{stats.totalProducts}</Text>
                  </BlockStack>
                </Grid.Cell>
                 <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack>
                    <Text as="p" variant="bodyMd" tone="subdued">Actieve producten</Text>
                    <Text as="p" variant="headingLg">{stats.activeProducts}</Text>
                  </BlockStack>
                </Grid.Cell>
                 <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack>
                    <Text as="p" variant="bodyMd" tone="subdued">Personaliseerbaar</Text>
                    <Text as="p" variant="headingLg">{stats.customizableProducts}</Text>
                  </BlockStack>
                </Grid.Cell>
                 <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack>
                    <Text as="p" variant="bodyMd" tone="subdued">Totale voorraad</Text>
                    <Text as="p" variant="headingLg">{stats.totalInventory}</Text>
                  </BlockStack>
                </Grid.Cell>
              </Grid>
              
              <Button 
                variant="primary" 
                onClick={() => navigate("/app/cards")}
              >
                Beheer producten
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <CalloutCard
            title="Maak je eerste product"
            illustration="https://cdn.shopify.com/s/files/1/0533/2089/files/empty-state.svg"
            primaryAction={{
              content: "Nieuw product aanmaken",
              onAction: () => {
                const shopName = shop.replace('.myshopify.com', '');
                const adminUrl = `https://admin.shopify.com/store/${shopName}/products/new?tags=simple-gifting-product`;
                window.open(adminUrl, '_blank');
              }
            }}
            secondaryAction={{
              content: "Bestaand product koppelen",
              onAction: () => navigate("/app/cards"),
            }}
          >
            <BlockStack gap="200">
              <Text as="p">
                Voeg je eerste gifting product toe. Dit kan een wenskaart, een lint, een sticker, of elk ander product zijn dat je klanten willen personaliseren.
              </Text>
              <List>
                <List.Item>
                  Klik op <strong>"Nieuw product aanmaken"</strong> om direct naar Shopify te gaan.
                </List.Item>
                <List.Item>
                  Of ga naar <strong>"Producten"</strong> om een bestaand product te koppelen.
                </List.Item>
              </List>
            </BlockStack>
          </CalloutCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
