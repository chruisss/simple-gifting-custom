import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Badge,
  Icon,
  Divider,
  Banner,
} from "@shopify/polaris";
import { 
  GiftCardIcon, 
  SettingsIcon, 
  CheckCircleIcon,
  AlertCircleIcon,
  ProductIcon,
  ThemeIcon,
  OrderIcon
} from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getShopConfiguration } from "../models/ShopConfiguration.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  try {
    const config = await getShopConfiguration(shop);
    
    // Proper theme extension check
    let themeConnected = false;
    try {
      // Check if the app block is actually installed in the theme
      const themeResponse = await admin.graphql(`
        query {
          themes(first: 1, role: MAIN) {
            nodes {
              id
              name
              files(filenames: ["templates/product.json"]) {
                nodes {
                  filename
                  body {
                    ... on OnlineStoreThemeFileBodyText {
                      content
                    }
                  }
                }
              }
            }
          }
        }
      `);
      
      const themeData = await themeResponse.json();
      const theme = themeData?.data?.themes?.nodes?.[0];
      
      if (theme) {
        // Check if our app block is referenced in the product template
        const productTemplate = theme.files?.nodes?.find((file: any) => 
          file.filename === 'templates/product.json'
        );
        
        if (productTemplate?.body?.content) {
          const templateContent = productTemplate.body.content;
          // Look for our app block in the template
          themeConnected = templateContent.includes('product-personalisatie') || 
                          templateContent.includes('simple-gifting') ||
                          templateContent.includes('@app');
        }
      }
    } catch (e) {
      console.log("Theme extension check failed:", e);
      themeConnected = false;
    }
    
    const isSetup = config.appIsEnabled && themeConnected;
    
    return json({
      config,
      themeConnected,
      isSetup,
      shop
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return json({
      config: null,
      themeConnected: false,
      isSetup: false,
      shop,
      error: "Fout bij laden dashboard"
    });
  }
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const config = data.config;
  const themeConnected = data.themeConnected;
  const isSetup = data.isSetup;
  const shop = data.shop;
  const error = 'error' in data ? data.error : null;

  return (
    <Page 
      title="Simple Gifting Dashboard"
      subtitle={`Winkel: ${shop}`}
      primaryAction={{
        content: "Instellingen",
        onAction: () => navigate("/app/settings"),
        icon: SettingsIcon
      }}
    >
      <TitleBar title="Simple Gifting" />
      
      {error && (
        <Layout.Section>
          <Banner tone="critical" title="Fout">
            <p>{error}</p>
          </Banner>
        </Layout.Section>
      )}

      <Layout>
        {/* Status Overview */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="headingLg" as="h2">
                  <InlineStack gap="200">
                    <Icon source={GiftCardIcon} />
                    <span>App Status</span>
                  </InlineStack>
                </Text>
                <Badge tone={isSetup ? "success" : "critical"}>
                  {isSetup ? "✅ Actief" : "⚠️ Setup Vereist"}
                </Badge>
              </InlineStack>
              
              <Divider />
              
              <BlockStack gap="300">
                {/* App Configuration Status */}
                <InlineStack align="space-between">
                  <InlineStack gap="200">
                    <Icon 
                      source={config?.appIsEnabled ? CheckCircleIcon : AlertCircleIcon} 
                      tone={config?.appIsEnabled ? "success" : "critical"} 
                    />
                    <Text as="span">App Ingeschakeld</Text>
                  </InlineStack>
                  <Badge tone={config?.appIsEnabled ? "success" : "critical"}>
                    {config?.appIsEnabled ? "Aan" : "Uit"}
                  </Badge>
                </InlineStack>

                {/* Theme Status */}
                <InlineStack align="space-between">
                  <InlineStack gap="200">
                    <Icon 
                      source={themeConnected ? CheckCircleIcon : AlertCircleIcon} 
                      tone={themeConnected ? "success" : "critical"} 
                    />
                    <Text as="span">Theme Verbonden</Text>
                  </InlineStack>
                  <Badge tone={themeConnected ? "success" : "critical"}>
                    {themeConnected ? "Verbonden" : "Niet Verbonden"}
                  </Badge>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Snelle Acties</Text>
              
              <InlineStack gap="300" wrap>
                <Button
                  onClick={() => navigate("/app/install")}
                  icon={SettingsIcon}
                  variant="primary"
                >
                  Setup & Installation
                </Button>
                
                <Button
                  onClick={() => navigate("/app/settings")}
                  icon={SettingsIcon}
                >
                  App Configureren
                </Button>
                
                <Button
                  onClick={() => navigate("/app/cards")}
                  icon={GiftCardIcon}
                >
                  Gift Cards
                </Button>
                
                <Button
                  onClick={() => navigate("/app/analytics")}
                  icon={OrderIcon}
                >
                  Analytics
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Setup Instructions */}
        {!isSetup && (
          <Layout.Section>
            <Banner tone="info" title="Setup Vereist">
              <BlockStack gap="200">
                <Text as="p">Om Simple Gifting te gebruiken:</Text>
                <BlockStack gap="100">
                  {!config?.appIsEnabled && (
                    <Text as="p">• Schakel de app in via Instellingen</Text>
                  )}
                  {!themeConnected && (
                    <Text as="p">• Installeer de theme extension</Text>
                  )}
                </BlockStack>
                <InlineStack gap="200">
                  <Button 
                    variant="primary"
                    onClick={() => navigate("/app/settings")}
                  >
                    Naar Instellingen
                  </Button>
                  <Button 
                    onClick={() => navigate("/app/help")}
                  >
                    Help
                  </Button>
                </InlineStack>
              </BlockStack>
            </Banner>
          </Layout.Section>
        )}

        {/* Current Configuration Summary */}
        {config && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">Huidige Configuratie</Text>
                
                <InlineStack gap="400" wrap>
                  <BlockStack gap="100">
                    <Text variant="bodySm" tone="subdued" as="span">App Status</Text>
                    <Text as="span">{config.appIsEnabled ? "Ingeschakeld" : "Uitgeschakeld"}</Text>
                  </BlockStack>
                  
                  <BlockStack gap="100">
                    <Text variant="bodySm" tone="subdued" as="span">Auto Tagging</Text>
                    <Text as="span">{config.autoTagging ? "Aan" : "Uit"}</Text>
                  </BlockStack>
                  
                  <BlockStack gap="100">
                    <Text variant="bodySm" tone="subdued" as="span">Debug Modus</Text>
                    <Text as="span">{config.debugMode ? "Aan" : "Uit"}</Text>
                  </BlockStack>
                  
                  <BlockStack gap="100">
                    <Text variant="bodySm" tone="subdued" as="span">Cache Strategie</Text>
                    <Text as="span">{config.cacheStrategy}</Text>
                  </BlockStack>

                  <BlockStack gap="100">
                    <Text variant="bodySm" tone="subdued" as="span">API Timeout</Text>
                    <Text as="span">{config.apiTimeout}s</Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
