import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Button,
  Grid,
  Icon,
  Divider,
  List,
  Banner,
  Collapsible,
  Link,
  Badge,
} from "@shopify/polaris";
import { 
  QuestionCircleIcon,
  EmailIcon,
  BookIcon,
  SettingsIcon,
  ProductIcon,
  GiftCardIcon,
  CodeIcon,
  BugIcon
} from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState, useCallback } from "react";

export default function HelpPage() {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});

  const toggleSection = useCallback((section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const faqItems = [
    {
      id: 'setup',
      question: 'How do I set up the app for the first time?',
      answer: 'Go to the Dashboard and click "Initialize Metafields" to create the required product metafields. Then you can tag products with "gifting-card" or "gifting-ribbon" to make them available for personalization.'
    },
    {
      id: 'products',
      question: 'Which products can I make customizable?',
      answer: 'Any product in your Shopify store can be made customizable. Simply add the tag "gifting-card" for cards or "gifting-ribbon" for ribbons, and configure the metafields for character limits.'
    },
    {
      id: 'limits',
      question: 'Can I set the character limit per product?',
      answer: 'Yes! Go to Products > select a product > edit the "Maximum Characters" metafield. The default limit is 150 characters, but this can be adjusted per product.'
    },
    {
      id: 'ribbons',
      question: 'How do I work with different ribbon lengths?',
      answer: 'Create variants of your ribbon product for different lengths (e.g. 50cm, 100cm, 150cm). Set the "Ribbon Length" metafield for each variant.'
    },
    {
      id: 'styling',
      question: 'Can I customize the appearance of the popup?',
      answer: 'Yes, go to Settings > Appearance to customize the popup style, animations, button colors, and other visual elements.'
    },
    {
      id: 'disable',
      question: 'How do I temporarily disable the app?',
      answer: 'Go to Settings > General and set the "App Status" to "Inactive". This hides all personalization options from customers without losing the configuration.'
    }
  ];

  const troubleshootingItems = [
    {
      id: 'no-popup',
      problem: 'Popup does not appear on product page',
      solution: 'Check if: 1) The app is enabled in Settings, 2) The product has the correct tag (gifting-card/gifting-ribbon), 3) The theme extension is activated in your theme editor.'
    },
    {
      id: 'metafields',
      problem: 'Metafields are not being saved',
      solution: 'Make sure you have initialized the metafield definitions via the Dashboard. If the problem persists, try initializing again.'
    },
    {
      id: 'character-limit',
      problem: 'Character limit is not working correctly',
      solution: 'Check if the "max_chars" metafield is set for the product. The default value is 150 characters if no value is set.'
    },
    {
      id: 'cart-not-adding',
      problem: 'Product is not being added to cart',
      solution: 'This can happen if the product is unavailable or out of stock. Check the product status and inventory in your Shopify admin.'
    }
  ];

  return (
    <Page title="Help & Support" subtitle="Documentation and support for Simple Gifting">
      <TitleBar title="Simple Gifting - Help" />
      
      <Layout>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">Quick links</Text>
              <BlockStack gap="200">
                <Button
                  variant="plain"
                  onClick={() => window.open('/app', '_self')}
                  icon={SettingsIcon}
                >
                  Dashboard
                </Button>
                <Button
                  variant="plain"
                  onClick={() => window.open('/app/cards', '_self')}
                  icon={ProductIcon}
                >
                  Manage Products
                </Button>
                <Button
                  variant="plain"
                  onClick={() => window.open('/app/settings', '_self')}
                  icon={SettingsIcon}
                >
                  Settings
                </Button>
              </BlockStack>
              
              <Divider />
              
              
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <BlockStack gap="500">
            
            {/* Getting Started */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">Getting Started</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Follow these steps to set up your gifting app
                    </Text>
                  </BlockStack>
                  <Icon source={BookIcon} tone="base" />
                </InlineStack>
                
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                    <BlockStack gap="300">
                      <Text as="h4" variant="headingSm">Step 1: Initialization</Text>
                      <List type="number">
                        <List.Item>Go to the Dashboard</List.Item>
                        <List.Item>Click "Initialize Metafields"</List.Item>
                        <List.Item>Wait for all metafields to be created</List.Item>
                      </List>
                      
                      <Text as="h4" variant="headingSm">Step 2: Set up Products</Text>
                      <List type="number">
                        <List.Item>Go to Products in your Shopify admin</List.Item>
                        <List.Item>Add tag "gifting-card" or "gifting-ribbon"</List.Item>
                        <List.Item>Set character limit via metafields</List.Item>
                      </List>
                    </BlockStack>
                  </Grid.Cell>
                  
                  <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                    <BlockStack gap="300">
                      <Text as="h4" variant="headingSm">Step 3: Theme extension</Text>
                      <List type="number">
                        <List.Item>Go to your Theme Editor</List.Item>
                        <List.Item>Look for "Product Personalization" block</List.Item>
                        <List.Item>Add it to your product template</List.Item>
                        <List.Item>Configure the settings</List.Item>
                      </List>
                      
                      <Text as="h4" variant="headingSm">Step 4: Testing</Text>
                      <List type="number">
                        <List.Item>Go to a product with gifting tag</List.Item>
                        <List.Item>Test the personalization popup</List.Item>
                        <List.Item>Check cart addition</List.Item>
                      </List>
                    </BlockStack>
                  </Grid.Cell>
                </Grid>
              </BlockStack>
            </Card>

            {/* FAQ */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h3" variant="headingMd">Frequently Asked Questions</Text>
                  <Icon source={QuestionCircleIcon} tone="base" />
                </InlineStack>
                
                <BlockStack gap="300">
                  {faqItems.map((item) => (
                    <div key={item.id}>
                      <div 
                        onClick={() => toggleSection(item.id)}
                        style={{ 
                          cursor: 'pointer', 
                          padding: '1rem',
                          border: '1px solid #e1e3e5',
                          borderRadius: '8px',
                          marginBottom: '0.5rem'
                        }}
                      >
                        <InlineStack align="space-between">
                          <Text as="span" variant="bodyMd">{item.question}</Text>
                          <Text as="span" variant="bodyMd">{openSections[item.id] ? '−' : '+'}</Text>
                        </InlineStack>
                      </div>
                      <Collapsible
                        open={openSections[item.id]}
                        id={`faq-${item.id}`}
                      >
                        <div style={{ padding: '1rem 0' }}>
                          <Text as="p" variant="bodyMd" tone="subdued">
                            {item.answer}
                          </Text>
                        </div>
                      </Collapsible>
                      <Divider />
                    </div>
                  ))}
                </BlockStack>
              </BlockStack>
            </Card>

            {/* Troubleshooting */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h3" variant="headingMd">Troubleshooting</Text>
                  <Icon source={BugIcon} tone="base" />
                </InlineStack>
                
                <BlockStack gap="300">
                  {troubleshootingItems.map((item) => (
                    <div key={item.id}>
                      <Banner
                        title={item.problem}
                        tone="warning"
                      >
                        <p>{item.solution}</p>
                      </Banner>
                    </div>
                  ))}
                </BlockStack>
              </BlockStack>
            </Card>

            {/* Advanced Configuration */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h3" variant="headingMd">Advanced Configuration</Text>
                  <Icon source={CodeIcon} tone="base" />
                </InlineStack>
                
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                    <BlockStack gap="300">
                      <Text as="h4" variant="headingSm">Metafield reference</Text>
                      <List type="bullet">
                        <List.Item>
                          <strong>simple_gifting.max_chars</strong> - Maximum characters (integer)
                        </List.Item>
                        <List.Item>
                          <strong>simple_gifting.product_type</strong> - "card" or "ribbon" (text)
                        </List.Item>
                        <List.Item>
                          <strong>simple_gifting.customizable</strong> - Customizable (boolean)
                        </List.Item>
                        <List.Item>
                          <strong>simple_gifting.ribbon_length</strong> - Ribbon length in cm (integer)
                        </List.Item>
                      </List>
                      
                      <Text as="h4" variant="headingSm">Product tags</Text>
                      <List type="bullet">
                        <List.Item><Badge>gifting-card</Badge> - For cards</List.Item>
                        <List.Item><Badge>gifting-ribbon</Badge> - For ribbons</List.Item>
                      </List>
                    </BlockStack>
                  </Grid.Cell>
                  
                  <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                    <BlockStack gap="300">
                      <Text as="h4" variant="headingSm">API endpoints</Text>
                      <List type="bullet">
                        <List.Item>
                          <strong>/apps/gifting/cards</strong> - Cards only
                        </List.Item>
                        <List.Item>
                          <strong>/apps/gifting/ribbons</strong> - Ribbons only
                        </List.Item>
                        <List.Item>
                          <strong>/apps/gifting/products</strong> - All products
                        </List.Item>
                        <List.Item>
                          <strong>/apps/gifting/config</strong> - App configuration
                        </List.Item>
                      </List>
                      
                      <Text as="h4" variant="headingSm">Theme blocks</Text>
                      <List type="bullet">
                        <List.Item>
                          <strong>product-personalisatie</strong> - Universal block
                        </List.Item>
                        <List.Item>
                          <strong>ribbon-personalisatie</strong> - Ribbon specific
                        </List.Item>
                      </List>
                    </BlockStack>
                  </Grid.Cell>
                </Grid>
              </BlockStack>
            </Card>

            {/* Support */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Still need help?</Text>
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 4, xl: 4 }}>
                    <BlockStack gap="200">
                      <Text as="h4" variant="headingSm">Email Support</Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Send us an email with your question and we will assist you within 24 hours.
                      </Text>
                      <Button
                        variant="primary"
                        onClick={() => window.open('mailto:support@simplegifting.com', '_blank')}
                      >
                        Send Email
                      </Button>
                    </BlockStack>
                  </Grid.Cell>
                  
                  <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 4, xl: 4 }}>
                    <BlockStack gap="200">
                      <Text as="h4" variant="headingSm">Documentation</Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Comprehensive guides and tutorials for all features.
                      </Text>
                      <Button
                        onClick={() => window.open('https://docs.simplegifting.com', '_blank')}
                      >
                        View Documentation
                      </Button>
                    </BlockStack>
                  </Grid.Cell>
                  
                  <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 4, xl: 4 }}>
                    <BlockStack gap="200">
                      <Text as="h4" variant="headingSm">Feature Request</Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Do you have an idea for a new feature? Let us know!
                      </Text>
                      <Button
                        onClick={() => window.open('https://feedback.simplegifting.com', '_blank')}
                      >
                        Give Feedback
                      </Button>
                    </BlockStack>
                  </Grid.Cell>
                </Grid>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}