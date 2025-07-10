import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import { useState } from "react";
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
  List,
  CalloutCard,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    // Check current subscription status
    const response = await admin.graphql(
      `#graphql
        query appSubscription {
          currentAppInstallation {
            activeSubscriptions {
              name
              status
              test
              createdAt
            }
          }
        }
      }`
    );

    const subData = await response.json();
    const subscriptions = subData.data?.currentAppInstallation?.activeSubscriptions || [];

    const activeSubscription = subscriptions.find(
      (sub: { name: string; status: string }) =>
        sub.name === "Monthly Subscription" && sub.status === "ACTIVE"
    );

    return json({
      hasActiveSubscription: !!activeSubscription,
      subscription: activeSubscription || null,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    // Re-throw a response to be caught by the ErrorBoundary
    throw new Response("Failed to load subscription details.", { status: 500 });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing } = await authenticate.admin(request);

  const billingResponse = await billing.require({
    plans: ["Monthly Subscription"],
    onFailure: async () =>
      billing.request({
        plan: "Monthly Subscription",
        isTest: true, // Set to false in production
        returnUrl: `${process.env.SHOPIFY_APP_URL}/app`,
      }),
  });

  return json({ success: true, billingResponse });
};

export default function Pricing() {
  const { hasActiveSubscription, subscription } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const handleSubscribe = () => {
    submit({}, { method: "post" });
  };

  if (hasActiveSubscription) {
    return (
      <Page>
        <TitleBar title="Subscription" />
        <Layout>
          <Layout.Section>
            <Banner tone="success">
              <p>
                <strong>Subscription Active</strong> - You have access to all Simple Gifting features.
              </p>
            </Banner>
            
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Current Plan: Monthly Subscription
                </Text>
                <Text as="p">
                  Price: $24.99/month
                </Text>
                <Text as="p">
                  Status: <Badge tone="success">Active</Badge>
                </Text>
                {subscription?.createdAt && (
                  <Text as="p">
                    Started: {new Date(subscription.createdAt).toLocaleDateString()}
                  </Text>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page>
      <TitleBar title="Choose Your Plan" />
      <Layout>
        <Layout.Section>
          <Banner tone="info">
            <p>
              Simple Gifting requires a subscription to access all features. Choose your plan below.
            </p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <BlockStack gap="200">
                  <Text variant="headingLg" as="h2">
                    Monthly Subscription
                  </Text>
                  <Text variant="headingXl" as="h3">
                    $24.99 <Text as="span" variant="bodySm">per month</Text>
                  </Text>
                </BlockStack>
                <Badge tone="attention">14-day free trial</Badge>
              </InlineStack>

              <Divider />

              <Text variant="headingMd" as="h3">
                What's included:
              </Text>
              
              <List>
                <List.Item>Unlimited gift card and ribbon customization</List.Item>
                <List.Item>Personal message functionality</List.Item>
                <List.Item>Seamless product page integration</List.Item>
                <List.Item>Analytics and insights</List.Item>
                <List.Item>Priority customer support</List.Item>
                <List.Item>Automatic updates and new features</List.Item>
              </List>

              <InlineStack align="end">
                <Button
                  variant="primary"
                  size="large"
                  onClick={handleSubscribe}
                  loading={isLoading}
                >
                  Start Free Trial
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <CalloutCard
            title="Questions about pricing?"
            illustration=""
            primaryAction={{
              content: "Contact Support",
              url: "/app/help",
            }}
          >
            <p>
              Our team is here to help you get the most out of Simple Gifting. 
              Reach out with any questions about our pricing or features.
            </p>
          </CalloutCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 