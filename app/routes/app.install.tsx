import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useNavigate, useActionData } from "@remix-run/react";
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
  ColorIcon
} from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getShopConfiguration, updateShopConfiguration } from "../models/ShopConfiguration.server";

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
    key: "gifting_product_handle",
    name: "Gifting Product Handle",
    description: "The handle of the associated gifting product to be added.",
    type: "product_reference",
    ownerType: "PRODUCT"
  }
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  // Check current subscription status
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

  return json({
    isSubscribed,
    metafieldsConfigured,
    requiredMetafields: METAFIELD_DEFINITIONS.length,
    appEnabled: config.appIsEnabled,
    shop
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, billing, session } = await authenticate.admin(request);
  const { shop } = session;
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "create_subscription") {
    try {
      const billingCheck = await billing.require({
        plans: ["Monthly Subscription"],
        onFailure: async () => billing.request({ 
          plan: "Monthly Subscription",
          isTest: true,
          returnUrl: `${process.env.SHOPIFY_APP_URL}/app/install`
        }),
      });

      return json({ success: true, billingCheck });
    } catch (error) {
      console.error("Error creating subscription:", error);
      return json({ success: false, error: "Failed to create subscription" });
    }
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
        });
      }

      const allSuccessful = results.every(r => r.success);
      return json({ success: allSuccessful, results });
    } catch (error) {
      console.error("Error configuring metafields:", error);
      return json({ success: false, error: "Failed to configure metafields" });
    }
  }

  if (action === "enable_app") {
    try {
      await updateShopConfiguration(shop, { appIsEnabled: true });
      return json({ success: true });
    } catch (error) {
      console.error("Error enabling app:", error);
      return json({ success: false, error: "Failed to enable app" });
    }
  }

  if (action === "complete_installation") {
    try {
      // Mark installation as complete
      // @ts-ignore - installationCompleted will be available after prisma generate
      await updateShopConfiguration(shop, { 
        appIsEnabled: true,
        installationCompleted: true 
      } as any);
      return json({ success: true });
    } catch (error) {
      console.error("Error completing installation:", error);
      return json({ success: false, error: "Failed to complete installation" });
    }
  }

  return json({ success: false, error: "Unknown action" });
};

export default function Install() {
  const { isSubscribed, metafieldsConfigured, requiredMetafields, appEnabled } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [toast, setToast] = useState<{ active: boolean; message: string; error?: boolean }>({
    active: false,
    message: "",
    error: false
  });

  const isLoading = navigation.state === "submitting";

  const initialSteps: InstallationStep[] = [
    {
      id: "subscription",
      title: "Activate Subscription",
      description: "Set up your monthly subscription to access all features",
      status: isSubscribed ? 'completed' : 'pending',
      icon: GiftCardIcon
    },
    {
      id: "metafields",
      title: "Configure Metafields",
      description: "Set up required product metafields for personalization",
      status: metafieldsConfigured >= requiredMetafields ? 'completed' : 'pending',
      icon: SettingsIcon
    },
    {
      id: "app_settings",
      title: "Enable App",
      description: "Activate the app in your store settings",
      status: appEnabled ? 'completed' : 'pending',
      icon: CheckCircleIcon
    },
    {
      id: "theme_setup",
      title: "Theme Setup",
      description: "Manual step: Activate the theme extension in your theme editor",
      status: 'pending',
      icon: ColorIcon
    }
  ];

  const [steps, setSteps] = useState(initialSteps);

  useEffect(() => {
    setSteps(initialSteps);
  }, [isSubscribed, metafieldsConfigured, appEnabled]);

  // Handle action data responses
  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        setToast({
          active: true,
          message: "Step completed successfully!",
          error: false
        });
        
        // Update step status based on action type
        if (navigation.formData) {
          const action = navigation.formData.get("action");
          if (action === "create_subscription") {
            updateStepStatus("subscription", "completed");
          } else if (action === "configure_metafields") {
            updateStepStatus("metafields", "completed");
          } else if (action === "enable_app") {
            updateStepStatus("app_settings", "completed");
          }
        }
      } else {
        setToast({
          active: true,
          message: (actionData as any).error || "An error occurred",
          error: true
        });
      }
    }
  }, [actionData]);

  const updateStepStatus = (stepId: string, status: InstallationStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const handleStepAction = async (stepId: string) => {
    updateStepStatus(stepId, 'in-progress');

    switch (stepId) {
      case "subscription":
        submit({ action: "create_subscription" }, { method: "post" });
        break;
      case "metafields":
        submit({ action: "configure_metafields" }, { method: "post" });
        break;
      case "app_settings":
        submit({ action: "enable_app" }, { method: "post" });
        break;
      case "theme_setup":
        // This is a manual step - just mark as completed for now
        updateStepStatus(stepId, 'completed');
        setToast({
          active: true,
          message: "Remember to activate the theme extension in your theme editor!"
        });
        break;
    }
  };

  const handleCompleteInstallation = () => {
    submit({ action: "complete_installation" }, { method: "post" });
    setTimeout(() => {
      navigate("/app");
    }, 1000);
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;
  const allStepsCompleted = completedSteps === steps.length;

  const getStepBadge = (status: InstallationStep['status']) => {
    switch (status) {
      case 'completed':
        return <Badge tone="success">Completed</Badge>;
      case 'in-progress':
        return <Badge tone="attention">In Progress</Badge>;
      case 'failed':
        return <Badge tone="critical">Failed</Badge>;
      default:
        return <Badge>Pending</Badge>;
    }
  };

  return (
    <Page>
      <TitleBar title="Setup Simple Gifting" />
      
      {toast.active && (
        <Toast
          content={toast.message}
          error={toast.error}
          onDismiss={() => setToast({ active: false, message: "" })}
        />
      )}

      <BlockStack gap="400">
        <Banner tone="info">
          <p>
            Welcome to Simple Gifting! Let's get everything set up for you. This will only take a few minutes.
          </p>
        </Banner>

        <Card>
          <BlockStack gap="400">
            <Text variant="headingLg" as="h2">
              Installation Progress
            </Text>
            <ProgressBar progress={progress} />
            <Text variant="bodyMd" as="p">
              {completedSteps} of {steps.length} steps completed
            </Text>
          </BlockStack>
        </Card>

        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              {steps.map((step, index) => (
                <Card key={step.id}>
                  <BlockStack gap="300">
                    <InlineStack align="space-between">
                      <InlineStack gap="300" blockAlign="center">
                        <Icon source={step.icon} />
                        <BlockStack gap="100">
                          <Text variant="headingMd" as="h3">
                            {step.title}
                          </Text>
                          <Text variant="bodyMd" as="p">
                            {step.description}
                          </Text>
                        </BlockStack>
                      </InlineStack>
                      {getStepBadge(step.status)}
                    </InlineStack>

                    {step.status === 'pending' && (
                      <InlineStack align="end">
                        <Button
                          onClick={() => handleStepAction(step.id)}
                          loading={isLoading}
                          variant="primary"
                        >                    {step.id === "subscription" ? "Start Free Trial" : 
                     step.id === "theme_setup" ? "Mark as Complete" : "Configure"}
                        </Button>
                      </InlineStack>
                    )}

                    {step.status === 'in-progress' && (
                      <InlineStack align="center">
                        <Spinner size="small" />
                        <Text variant="bodyMd" as="span">Processing...</Text>
                      </InlineStack>
                    )}

                    {step.id === "theme_setup" && step.status === 'pending' && (
                      <Banner tone="warning">
                        <BlockStack gap="200">
                          <Text variant="bodyMd" as="p">
                            <strong>Manual step required:</strong>
                          </Text>
                          <List>
                            <List.Item>Go to your Shopify admin → Online Store → Themes</List.Item>
                            <List.Item>Click "Customize" on your active theme</List.Item>
                            <List.Item>Add the "Simple Gifting" app block to your product pages</List.Item>
                            <List.Item>Save your theme</List.Item>
                          </List>
                        </BlockStack>
                      </Banner>
                    )}
                  </BlockStack>
                </Card>
              ))}
            </BlockStack>
          </Layout.Section>

          {allStepsCompleted && (
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="center">
                    <Icon source={CheckCircleIcon} tone="success" />
                    <Text variant="headingLg" as="h2">
                      Installation Complete!
                    </Text>
                  </InlineStack>
                  <Text variant="bodyMd" as="p" alignment="center">
                    Simple Gifting is now ready to use. You can start adding personalizations to your products.
                  </Text>
                  <InlineStack align="center">
                    <Button
                      onClick={handleCompleteInstallation}
                      variant="primary"
                      size="large"
                      loading={isLoading}
                    >
                      Go to Dashboard
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          )}
        </Layout>
      </BlockStack>
    </Page>
  );
}
