import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
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
  List,
  CalloutCard,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, billing } = await authenticate.admin(request);

  try {
    // Use Shopify's billing helper to check subscription status
    const { hasActivePayment, appSubscriptions } = await billing.check({
      plans: ["Monthly Subscription"],
    });
    
    // If we have active payment, check if it's our subscription
    const hasActiveSubscription = hasActivePayment && appSubscriptions.some(
      (sub: any) => sub.name === "Monthly Subscription" && sub.status === "ACTIVE"
    );
    
    const activeSubscription = appSubscriptions.find(
      (sub: any) => sub.name === "Monthly Subscription" && sub.status === "ACTIVE"
    );

    return json({
      hasActiveSubscription,
      subscription: activeSubscription || null,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    // Re-throw a response to be caught by the ErrorBoundary
    throw new Response("Failed to load subscription details.", { status: 500 });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const { shop } = session;

  try {
    // For Managed Pricing apps, check if subscription exists
    const billingCheck = await billing.check({
      plans: ["Monthly Subscription"],
      isTest: true,
    });
    
    if (billingCheck.hasActivePayment) {
      // Subscription already exists, return success
      return json({ 
        success: true, 
        billingCheck,
        message: "Subscription is already active" 
      });
    } else {
      // No active subscription, return the redirect URL to be handled client-side
      const returnUrl = encodeURIComponent(`${process.env.SHOPIFY_APP_URL}/app/pricing`);
      
      // Extract store handle from shop domain (e.g., "cool-shop" from "cool-shop.myshopify.com")
      const storeHandle = shop.replace('.myshopify.com', '');
      
      // Return the plan selection URL for client-side redirect
      const planSelectionUrl = `https://admin.shopify.com/store/${storeHandle}/charges/simple-gifting/pricing_plans?return_url=${returnUrl}`;
      
      return json({ 
        success: false, 
        redirect: planSelectionUrl,
        message: "Redirecting to plan selection..." 
      });
    }
  } catch (error) {
    // If it's a redirect, re-throw it
    if (error instanceof Response && error.status >= 300 && error.status < 400) {
      throw error;
    }
    
    console.error("Error processing billing:", error);
    return json({ 
      success: false, 
      error: "Failed to process subscription",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export default function Pricing() {
  const { hasActiveSubscription, subscription } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const handleSubscribe = () => {
    submit({}, { method: "post" });
  };

  // Handle redirect for embedded apps
  useEffect(() => {
    if (actionData && (actionData as any).redirect) {
      const redirectUrl = (actionData as any).redirect;
      console.log("Redirecting to plan selection:", redirectUrl);
      
      // Use window.top to break out of the iframe
      if (window.top) {
        window.top.location.href = redirectUrl;
      } else {
        // Fallback for non-iframe environments
        window.location.href = redirectUrl;
      }
    }
  }, [actionData]);

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
                  Price: $24.99/month with 14-day free trial (free for development stores)
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
                  {isLoading ? "Redirecting..." : "Abonnement afsluiten"}
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