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
      
      const existingMetafields = data?.metafieldDefinitions?.edges.map((edge: any) => edge.node.key) || [];
      const requiredMetafieldKeys = new Set(METAFIELD_DEFINITIONS.map(def => def.key));
      
      const configuredCount = existingMetafields.filter((key: string) => requiredMetafieldKeys.has(key)).length;

      const products = data?.products?.edges.map((edge: any) => edge.node) || [];
      
      stats = {
        totalProducts: products.length,
        activeProducts: products.filter((p: any) => p.status === 'ACTIVE').length,
        customizableProducts: products.filter((p: any) => p.customizable?.value === 'true').length,
        totalInventory: products.reduce((sum: number, p: any) => sum + (p.totalInventory || 0), 0),
        metafieldsConfigured: configuredCount,
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
      // 1. Get existing metafield definitions
      const existingDefinitionsResponse = await admin.graphql(
        `#graphql
          query existingMetafieldDefinitions($namespace: String!) {
            metafieldDefinitions(first: 10, namespace: $namespace, ownerType: PRODUCT) {
              edges {
                node {
                  key
                }
              }
            }
          }`,
        { variables: { namespace: "simple_gifting" } }
      );
      const existingDefinitionsJson = await existingDefinitionsResponse.json();
      const existingKeys = new Set(
        existingDefinitionsJson.data?.metafieldDefinitions?.edges.map(
          (edge: { node: { key: string } }) => edge.node.key
        ) || []
      );
      
      const results = [];
      
      // 2. Loop through required definitions and create only if they don't exist
      for (const definition of METAFIELD_DEFINITIONS) {
        if (existingKeys.has(definition.key)) {
          results.push({
            key: definition.key,
            success: true,
            errors: [],
          });
          continue; // Already exists, skip to the next one
        }

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
        setToastContent("Configuration saved successfully!");
        setToastIsError(false);
      } else {
        setToastContent("An error occurred while configuring.");
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

  const requiredMetafields = 3;
  const configurationStatus = stats.metafieldsConfigured >= requiredMetafields
    ? {
        title: "Configuration Complete",
        status: "success",
        icon: CheckCircleIcon,
        description: "All required metafields are set.",
        button: null
      }
    : {
        title: "Configuration Required",
        status: "critical",
        icon: AlertCircleIcon,
        description: `${stats.metafieldsConfigured} of the ${requiredMetafields} required metafields found.`,
        button: (
          <Button
            onClick={handleInitialize}
            loading={isLoading}
            variant="primary"
          >
            Configure now
          </Button>
        )
      };

  const subscriptionStatus = isSubscribed
    ? {
        title: "Subscription Active",
        status: "success",
        icon: CheckCircleIcon,
        description: "You have an active subscription.",
        button: (
          <Button onClick={() => navigate('/app/pricing')}>
            Manage subscription
          </Button>
        )
      }
    : {
        title: "No Active Subscription",
        status: "critical",
        icon: AlertCircleIcon,
        description: "You do not have an active subscription. Activate a subscription to use the app.",
        button: (
          <Button onClick={() => navigate('/app/pricing')} variant="primary">
            View subscriptions
          </Button>
        )
      };

  const isReady = stats.metafieldsConfigured >= requiredMetafields && isSubscribed;

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
                  Welcome to Simple Gifting
                </Text>
                <Text variant="bodyMd" as="p">
                  Here is an overview of your current configuration and usage.
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
                          {configurationStatus.title === 'Configuratie Compleet' ? 'Configuration Complete' : 'Configuration Required'}
                        </Text>
                        <Badge tone={configurationStatus.status as any}>
                          {configurationStatus.status === 'success' ? 'Complete' : 'Action required'}
                        </Badge>
                      </InlineStack>
                       <InlineStack gap="300" blockAlign="center">
                        <Icon source={configurationStatus.icon} tone={configurationStatus.status as any} />
                        <Text variant="bodyMd" as="p">{configurationStatus.description.replace('Alle benodigde metafields zijn ingesteld.', 'All required metafields are set.').replace('van de', 'of the').replace('benodigde metafields zijn gevonden.', 'required metafields found.')}</Text>
                      </InlineStack>
                      {configurationStatus.button && (
                        <Button
                          onClick={handleInitialize}
                          loading={isLoading}
                          variant="primary"
                        >
                          Configure now
                        </Button>
                      )}
                    </BlockStack>
                  </Card>
                </Grid.Cell>
                 <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 6, xl: 6}}>
                  <Card>
                     <BlockStack gap="400">
                      <InlineStack align="space-between">
                         <Text variant="headingMd" as="h3">
                          {subscriptionStatus.title === 'Abonnement Actief' ? 'Subscription Active' : 'No Active Subscription'}
                        </Text>
                        <Badge tone={subscriptionStatus.status as any}>
                          {subscriptionStatus.status === 'success' ? 'Active' : 'Inactive'}
                        </Badge>
                      </InlineStack>
                      <InlineStack gap="300" blockAlign="center">
                        <Icon source={subscriptionStatus.icon} tone={subscriptionStatus.status as any} />
                        <Text variant="bodyMd" as="p">{subscriptionStatus.description.replace('Je hebt een actief abonnement.', 'You have an active subscription.').replace('Je hebt geen actief abonnement. Activeer een abonnement om de app te gebruiken.', 'You do not have an active subscription. Activate a subscription to use the app.')}</Text>
                      </InlineStack>
                      {subscriptionStatus.button && (
                        <Button onClick={() => navigate('/app/pricing')} variant={subscriptionStatus.status === 'success' ? undefined : 'primary'}>
                          {subscriptionStatus.status === 'success' ? 'Manage subscription' : 'View subscriptions'}
                        </Button>
                      )}
                    </BlockStack>
                  </Card>
                </Grid.Cell>
              </Grid>
          </Layout.Section>
          
          {isReady ? (
            <Layout.Section>
              <CalloutCard
                title="Everything is ready!"
                illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customize-card-background-shape-light-356b96365306d2b311c2522616b5de6321b8f52097745ac9c898df5b3310d48f.svg"
                primaryAction={{
                  content: 'Configure products',
                  onAction: () => navigate('/app/cards'),
                }}
              >
                <p>You are all set to add personalizations to your products. Go to the products page to get started.</p>
              </CalloutCard>
            </Layout.Section>
          ) : (
             <Layout.Section>
              <Banner title="Complete the setup" tone="warning">
                <p>Complete the configuration and activate a subscription to use the full functionality of the app.</p>
              </Banner>
            </Layout.Section>
          )}

          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <Text variant="headingLg" as="h3">Statistics</Text>
                <Divider />
                <Grid>
                  <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 2, lg: 3, xl: 3}}>
                     <BlockStack gap="200" align="center">
                      <Text variant="headingXl" as="h4">{stats.totalProducts}</Text>
                      <InlineStack gap="100" align="center">
                        <Icon source={ProductIcon} tone="base" />
                        <Text variant="bodyMd" as="p">Total Products</Text>
                      </InlineStack>
                    </BlockStack>
                  </Grid.Cell>
                   <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 2, lg: 3, xl: 3}}>
                     <BlockStack gap="200" align="center">
                      <Text variant="headingXl" as="h4">{stats.activeProducts}</Text>
                      <InlineStack gap="100" align="center">
                        <Icon source={CheckCircleIcon} tone="success" />
                        <Text variant="bodyMd" as="p">Active Products</Text>
                      </InlineStack>
                    </BlockStack>
                  </Grid.Cell>
                   <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 2, lg: 3, xl: 3}}>
                     <BlockStack gap="200" align="center">
                      <Text variant="headingXl" as="h4">{stats.customizableProducts}</Text>
                       <InlineStack gap="100" align="center">
                        <Icon source={GiftCardIcon} tone="interactive" />
                        <Text variant="bodyMd" as="p">Customizable</Text>
                      </InlineStack>
                    </BlockStack>
                  </Grid.Cell>
                   <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 2, lg: 3, xl: 3}}>
                     <BlockStack gap="200" align="center">
                      <Text variant="headingXl" as="h4">{stats.totalInventory}</Text>
                       <InlineStack gap="100" align="center">
                        <Icon source={SettingsIcon} tone="base" />
                        <Text variant="bodyMd" as="p">Total Inventory</Text>
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
