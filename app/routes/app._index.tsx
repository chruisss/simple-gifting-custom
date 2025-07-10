import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit, useActionData, useNavigation } from "@remix-run/react";
import { useState, useCallback, useEffect } from "react";
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
  Toast,
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

  const activeSubscriptions = await admin.graphql(
    `#graphql
      query appSubscription {
        currentAppInstallation {
          activeSubscriptions {
            name
            status
            test
          }
        }
      }`
  );

  const subData = await activeSubscriptions.json();
  const subscriptions = subData.data?.currentAppInstallation?.activeSubscriptions || [];

  const isSubscribed = subscriptions.some(
    (sub: { name: string; status: string }) =>
      sub.name === "Monthly Subscription" && sub.status === "ACTIVE"
  );

  // Get shop configuration
  const config = await getShopConfiguration(shop);
  
  // Get basic stats even without subscription
  let stats = {
    totalProducts: 0,
    activeProducts: 0,
    customizableProducts: 0,
    totalInventory: 0,
    metafieldsConfigured: 0,
    appEnabled: config.appIsEnabled
  };

  // Only get detailed stats if subscribed
  if (isSubscribed) {
    try {
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
      
      const products = data?.products?.edges.map((edge: any) => edge.node) || [];
      const metafields = data?.metafieldDefinitions?.edges.map((edge: any) => edge.node) || [];
      
      stats = {
        totalProducts: products.length,
        activeProducts: products.filter((p: any) => p.status === 'ACTIVE').length,
        customizableProducts: products.filter((p: any) => p.customizable?.value === 'true').length,
        totalInventory: products.reduce((sum: number, p: any) => sum + (p.totalInventory || 0), 0),
        metafieldsConfigured: metafields.length,
        appEnabled: config.appIsEnabled
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Don't crash the page, just return stats as 0
    }
  }

  return json({ config, stats, shop, isSubscribed });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "initialize") {
    try {
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
        const result = responseJson.data?.metafieldDefinitionCreate;
        
        if (result?.userErrors.length > 0) {
          console.error(`Metafield definition creation failed for ${definition.key}:`, result.userErrors);
        }
        
        results.push({
          key: definition.key,
          success: result && result.createdDefinition !== null,
          errors: result ? result.userErrors : [{ message: `Failed to create metafield definition for ${definition.key}.` }],
        });
      }

      const allSuccessful = results.every(r => r.success);
      const allErrors = results.flatMap(r => r.errors);

      return json({
        success: allSuccessful,
        results,
        errors: allErrors,
      });
    } catch (error) {
      console.error("Error during metafield initialization:", error);
      // Re-throw a response to be caught by the ErrorBoundary
      throw new Response("Failed to initialize metafields.", { status: 500 });
    }
  }

  return json({ success: false, errors: [] });
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
    key: "is_gifting_product",
    name: "Is Gifting Product",
    description: "Flags if this product is used for gifting personalization.",
    type: "boolean",
    ownerType: "PRODUCT"
  },
  {
    namespace: "simple_gifting",
    key: "gifting_product_handle",
    name: "Gifting Product Handle",
    description: "The handle of the associated gifting product to be added.",
    type: "product_reference",
    ownerType: "PRODUCT"
  },
  {
    namespace: "simple_gifting",
    key: "custom_message",
    name: "Custom Message",
    description: "The custom message from the customer.",
    type: "string",
    ownerType: "LINE_ITEM"
  }
];

export default function Dashboard() {
  const { config, stats, shop, isSubscribed } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const submit = useSubmit();

  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState("");
  const [toastIsError, setToastIsError] = useState(false);

  const toggleToastActive = useCallback(() => setToastActive((active) => !active), []);
  const toastMarkup = toastActive ? (
    <Toast content={toastContent} onDismiss={toggleToastActive} error={toastIsError} />
  ) : null;

  const isLoading =
    navigation.state === "submitting" &&
    navigation.formData?.get("action") === "initialize";

  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        setToastContent("Configuratie succesvol opgeslagen!");
        setToastIsError(false);
      } else {
        setToastContent("Er is een fout opgetreden bij het configureren.");
        setToastIsError(true);
        if (actionData.errors) {
          console.error("Configuration errors:", actionData.errors);
        }
      }
      setToastActive(true);
    }
  }, [actionData]);

  const handleInitialize = () => {
    submit({ action: "initialize" }, { method: "post" });
  };
  
  const handleNavigateToSettings = () => {
    navigate("/app/settings");
  };

  const configurationStatus = stats.metafieldsConfigured >= 4
    ? {
        title: "Configuratie Compleet",
        status: "success",
        icon: CheckCircleIcon,
        description: "Alle benodigde metafields zijn ingesteld.",
        button: null
      }
    : {
        title: "Configuratie Vereist",
        status: "critical",
        icon: AlertCircleIcon,
        description: `${stats.metafieldsConfigured} van de 4 benodigde metafields zijn gevonden.`,
        button: (
          <Button
            onClick={handleInitialize}
            loading={isLoading}
            variant="primary"
          >
            Configureer nu
          </Button>
        ),
      };

  const subscriptionStatus = isSubscribed
    ? {
        title: "Abonnement Actief",
        status: "success",
        icon: CheckCircleIcon,
        description: "Je hebt een actief abonnement.",
        button: (
          <Button onClick={() => navigate('/app/pricing')}>
            Beheer abonnement
          </Button>
        )
      }
    : {
        title: "Geen Actief Abonnement",
        status: "critical",
        icon: AlertCircleIcon,
        description: "Je hebt geen actief abonnement. Activeer een abonnement om de app te gebruiken.",
        button: (
          <Button onClick={() => navigate('/app/pricing')} variant="primary">
            Bekijk abonnementen
          </Button>
        )
      };

  const isReady = stats.metafieldsConfigured >= 4 && isSubscribed;

  return (
    <Page>
      <TitleBar title="Dashboard" />
      {toastMarkup}
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <Text variant="headingXl" as="h2">
                  Welkom bij Simple Gifting
                </Text>
                <Text variant="bodyMd" as="p">
                  Hier is een overzicht van je huidige configuratie en gebruik.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
             <Grid>
                <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 6, xl: 6}}>
                  <Card>
                    <BlockStack gap="400">
                      <InlineStack align="space-between">
                         <Text variant="headingMd" as="h3">
                          {configurationStatus.title}
                        </Text>
                        <Badge tone={configurationStatus.status as any}>
                          {configurationStatus.status === 'success' ? 'Compleet' : 'Actie vereist'}
                        </Badge>
                      </InlineStack>
                       <InlineStack gap="300" blockAlign="center">
                        <Icon source={configurationStatus.icon} tone={configurationStatus.status as any} />
                        <Text variant="bodyMd" as="p">{configurationStatus.description}</Text>
                      </InlineStack>
                      {configurationStatus.button}
                    </BlockStack>
                  </Card>
                </Grid.Cell>
                 <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 6, xl: 6}}>
                  <Card>
                     <BlockStack gap="400">
                      <InlineStack align="space-between">
                         <Text variant="headingMd" as="h3">
                          {subscriptionStatus.title}
                        </Text>
                        <Badge tone={subscriptionStatus.status as any}>
                          {subscriptionStatus.status === 'success' ? 'Actief' : 'Inactief'}
                        </Badge>
                      </InlineStack>
                      <InlineStack gap="300" blockAlign="center">
                        <Icon source={subscriptionStatus.icon} tone={subscriptionStatus.status as any} />
                        <Text variant="bodyMd" as="p">{subscriptionStatus.description}</Text>
                      </InlineStack>
                      {subscriptionStatus.button}
                    </BlockStack>
                  </Card>
                </Grid.Cell>
              </Grid>
          </Layout.Section>
          
          {isReady ? (
            <Layout.Section>
              <CalloutCard
                title="Alles is klaar!"
                illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customize-card-background-shape-light-356b96365306d2b311c2522616b5de6321b8f52097745ac9c898df5b3310d48f.svg"
                primaryAction={{
                  content: 'Producten configureren',
                  onAction: () => navigate('/app/cards'),
                }}
              >
                <p>Je bent helemaal klaar om personalisaties aan je producten toe te voegen. Ga naar de productpagina om te beginnen.</p>
              </CalloutCard>
            </Layout.Section>
          ) : (
             <Layout.Section>
              <Banner title="Voltooi de setup" tone="warning">
                <p>Voltooi de configuratie en activeer een abonnement om de volledige functionaliteit van de app te gebruiken.</p>
              </Banner>
            </Layout.Section>
          )}

          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <Text variant="headingLg" as="h3">Statistieken</Text>
                <Divider />
                <Grid>
                  <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 2, lg: 3, xl: 3}}>
                     <BlockStack gap="200" align="center">
                      <Text variant="headingXl" as="h4">{stats.totalProducts}</Text>
                      <InlineStack gap="100" align="center">
                        <Icon source={ProductIcon} tone="base" />
                        <Text variant="bodyMd" as="p">Totaal Producten</Text>
                      </InlineStack>
                    </BlockStack>
                  </Grid.Cell>
                   <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 2, lg: 3, xl: 3}}>
                     <BlockStack gap="200" align="center">
                      <Text variant="headingXl" as="h4">{stats.activeProducts}</Text>
                      <InlineStack gap="100" align="center">
                        <Icon source={CheckCircleIcon} tone="success" />
                        <Text variant="bodyMd" as="p">Actieve Producten</Text>
                      </InlineStack>
                    </BlockStack>
                  </Grid.Cell>
                   <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 2, lg: 3, xl: 3}}>
                     <BlockStack gap="200" align="center">
                      <Text variant="headingXl" as="h4">{stats.customizableProducts}</Text>
                       <InlineStack gap="100" align="center">
                        <Icon source={GiftCardIcon} tone="interactive" />
                        <Text variant="bodyMd" as="p">Aanpasbaar</Text>
                      </InlineStack>
                    </BlockStack>
                  </Grid.Cell>
                   <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 2, lg: 3, xl: 3}}>
                     <BlockStack gap="200" align="center">
                      <Text variant="headingXl" as="h4">{stats.totalInventory}</Text>
                       <InlineStack gap="100" align="center">
                        <Icon source={SettingsIcon} tone="base" />
                        <Text variant="bodyMd" as="p">Totale Voorraad</Text>
                      </InlineStack>
                    </BlockStack>
                  </Grid.Cell>
                </Grid>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
