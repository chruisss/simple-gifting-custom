import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "@remix-run/react";
import { useState, useEffect } from "react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Badge,
  Banner,
  ProgressBar,
  List,
  Icon,
  Divider,
  Spinner,
  Toast,
} from "@shopify/polaris";
import { 
  CheckCircleIcon, 
  AlertCircleIcon,
  SettingsIcon,
  GiftCardIcon,
} from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getShopConfiguration, updateShopConfiguration } from "../models/ShopConfiguration.server";
import { checkThemeCompatibility } from "../utils/themeCompatibility.server";
import { ThemeSetup } from "../components/ThemeSetup";

interface InstallationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  icon: any;
}

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
    key: "placeholder_text",
    name: "Placeholder Text",
    description: "Placeholder text for personalization input",
    type: "single_line_text_field",
    ownerType: "PRODUCT"
  },
  {
    namespace: "simple_gifting",
    key: "required",
    name: "Required Field",
    description: "Whether personalization is required for this product",
    type: "boolean",
    ownerType: "PRODUCT"
  }
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("APP INSTALL LOADER - Starting authentication for:", request.url);
  
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;
  
  console.log("APP INSTALL LOADER - Authentication successful for shop:", shop);

  // Development app - no billing needed
  const isSubscribed = true; // Always true for development apps

  // Check metafields
  const metafieldsResponse = await admin.graphql(
    `#graphql
      query metafieldDefinitions {
        metafieldDefinitions(first: 10, ownerType: PRODUCT, namespace: "simple_gifting") {
          edges {
            node {
              key
            }
          }
        }
      }
    `
  );

  const metafieldsData = await metafieldsResponse.json();
  const existingMetafields = metafieldsData.data?.metafieldDefinitions?.edges.map((edge: any) => edge.node.key) || [];
  const requiredMetafieldKeys = new Set(METAFIELD_DEFINITIONS.map(def => def.key));
  const metafieldsConfigured = existingMetafields.filter((key: string) => requiredMetafieldKeys.has(key)).length;

  // Get shop configuration
  const config = await getShopConfiguration(shop);

  // Check theme compatibility
  const themeCompatibility = await checkThemeCompatibility(admin, "product-personalisatie");
  
  // Get app configuration
  const appConfig = {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shop: shop,
    extensionHandle: "product-personalisatie",
  };

  return json({
    isSubscribed,
    metafieldsConfigured,
    requiredMetafields: METAFIELD_DEFINITIONS.length,
    appEnabled: config.appIsEnabled,
    shop,
    themeCompatibility,
    appConfig
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "create_subscription") {
    // Development app - no billing needed, always return success
    return json({ 
      success: true,
      message: "Development app - no subscription required" 
    });
  }

  if (action === "configure_metafields") {
    try {
      // Get existing metafield definitions
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
      
      // Create metafield definitions
      for (const definition of METAFIELD_DEFINITIONS) {
        if (existingKeys.has(definition.key)) {
          results.push({ key: definition.key, success: true });
          continue;
        }

        const response = await admin.graphql(
          `#graphql
            mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
              metafieldDefinitionCreate(definition: $definition) {
                createdDefinition {
                  id
                  key
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
          { variables: { definition } }
        );

        const responseJson = await response.json();
        const userErrors = responseJson.data?.metafieldDefinitionCreate?.userErrors || [];
        
        if (userErrors.length > 0) {
          results.push({ key: definition.key, success: false, errors: userErrors });
        } else {
          results.push({ key: definition.key, success: true });
        }
      }

      return json({ success: true, results });
    } catch (error) {
      console.error("Error configuring metafields:", error);
      return json({ success: false, error: "Failed to configure metafields" });
    }
  }

  if (action === "enable_app") {
    try {
      await updateShopConfiguration(shop, { appIsEnabled: true });
      return json({ success: true, message: "App enabled successfully" });
    } catch (error) {
      console.error("Error enabling app:", error);
      return json({ success: false, error: "Failed to enable app" });
    }
  }

  if (action === "complete_installation") {
    try {
      await updateShopConfiguration(shop, { 
        installationCompleted: true,
        appIsEnabled: true 
      });
      return json({ success: true, message: "Installation completed successfully" });
    } catch (error) {
      console.error("Error completing installation:", error);
      return json({ success: false, error: "Failed to complete installation" });
    }
  }

  return json({ success: false, error: "Unknown action" });
};

export default function Install() {
  const { isSubscribed, metafieldsConfigured, requiredMetafields, appEnabled, themeCompatibility, appConfig } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  const isLoading = navigation.state === "submitting";

  useEffect(() => {
    if (actionData?.success) {
      const message = (actionData as any).message || "Action completed successfully!";
      setToastMessage(message);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  }, [actionData]);

  const steps: InstallationStep[] = [
    {
      id: "subscription",
      title: "App Subscription",
      description: "Development app - no subscription required",
      status: isSubscribed ? 'completed' : 'pending',
      icon: CheckCircleIcon,
    },
    {
      id: "metafields",
      title: "Configure Metafields",
      description: `Configure ${requiredMetafields} product metafields for personalization`,
      status: metafieldsConfigured === requiredMetafields ? 'completed' : 'pending',
      icon: SettingsIcon,
    },
    {
      id: "theme",
      title: "Theme Setup",
      description: "Install app blocks in your theme",
      status: (themeCompatibility as any).isSupported ? 'completed' : 'pending',
      icon: GiftCardIcon,
    },
    {
      id: "enable",
      title: "Enable App",
      description: "Activate the app for your store",
      status: appEnabled ? 'completed' : 'pending',
      icon: CheckCircleIcon,
    },
  ];

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;

  const handleAction = (actionType: string) => {
    const formData = new FormData();
    formData.append("action", actionType);
    submit(formData, { method: "post" });
  };

  const getStepBadge = (step: InstallationStep) => {
    switch (step.status) {
      case 'completed':
        return <Badge tone="success">Completed</Badge>;
      case 'in-progress':
        return <Badge tone="info">In Progress</Badge>;
      case 'failed':
        return <Badge tone="critical">Failed</Badge>;
      default:
        return <Badge>Pending</Badge>;
    }
  };

  return (
    <Page>
      <TitleBar title="App Installation" />
      
      {showSuccessToast && (
        <Toast content={toastMessage} onDismiss={() => setShowSuccessToast(false)} />
      )}

      <Layout>
        <Layout.Section>
          <Banner title="Development App Setup" tone="info">
            <p>
              You're setting up Simple Gifting as a development app. No subscription is required, and you'll have access to all features.
            </p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Installation Progress
              </Text>
              <ProgressBar progress={progress} size="large" />
              <Text variant="bodySm" tone="subdued" as="p">
                {completedSteps} of {steps.length} steps completed
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <BlockStack gap="400">
            {steps.map((step, index) => (
              <Card key={step.id}>
                <BlockStack gap="300">
                  <InlineStack align="space-between">
                    <InlineStack gap="300">
                      <Icon source={step.icon} />
                      <BlockStack gap="100">
                        <Text variant="headingMd" as="h3">
                          {step.title}
                        </Text>
                        <Text variant="bodyMd" tone="subdued" as="p">
                          {step.description}
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    {getStepBadge(step)}
                  </InlineStack>

                  {step.id === "subscription" && !isSubscribed && (
                    <Button
                      variant="primary"
                      loading={isLoading}
                      onClick={() => handleAction("create_subscription")}
                    >
                      Setup Development App
                    </Button>
                  )}

                  {step.id === "metafields" && metafieldsConfigured < requiredMetafields && (
                    <Button
                      variant="primary"
                      loading={isLoading}
                      onClick={() => handleAction("configure_metafields")}
                    >
                      Configure Metafields ({metafieldsConfigured}/{requiredMetafields})
                    </Button>
                  )}

                  {step.id === "theme" && (
                    <ThemeSetup 
                      shop={appConfig.shop}
                      apiKey={appConfig.apiKey}
                      extensionHandle={appConfig.extensionHandle}
                    />
                  )}

                  {step.id === "enable" && !appEnabled && (
                    <Button
                      variant="primary"
                      loading={isLoading}
                      onClick={() => handleAction("enable_app")}
                    >
                      Enable App
                    </Button>
                  )}
                </BlockStack>
              </Card>
            ))}
          </BlockStack>
        </Layout.Section>

        {completedSteps === steps.length && (
          <Layout.Section>
            <Banner title="Installation Complete!" tone="success">
              <p>
                Congratulations! Your Simple Gifting development app is now fully configured and ready to use.
              </p>
              <Button
                variant="primary"
                onClick={() => handleAction("complete_installation")}
              >
                Finish Setup
              </Button>
            </Banner>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
