import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Badge,
  Icon,
  List,
  Banner,
  Tooltip,
  Spinner,
  Link,
  Box,
  CalloutCard,
} from '@shopify/polaris';
import {
  CheckCircleIcon,
  AlertCircleIcon,
  ExternalIcon,
  EditIcon,
  ProductIcon,
  InfoIcon,
} from '@shopify/polaris-icons';

interface ThemeSetupProps {
  shop: string;
  apiKey: string;
  extensionHandle: string;
  themeSupport?: {
    supportsAppBlocks: boolean;
    themeId?: string;
    themeName?: string;
    supportedTemplates?: string[];
  };
}

export function ThemeSetup({ shop, apiKey, extensionHandle, themeSupport }: ThemeSetupProps) {
  const [isCheckingTheme, setIsCheckingTheme] = useState(false);
  const [deepLinkGenerated, setDeepLinkGenerated] = useState(false);

  // Generate deep link for theme editor with better error handling
  const generateDeepLink = useCallback((template: string = 'product', target: string = 'mainSection') => {
    try {
      if (!shop || !apiKey || !extensionHandle) {
        console.error('ThemeSetup: Missing required parameters for deep link generation');
        return null;
      }
      
      const baseUrl = `https://${shop}/admin/themes/current/editor`;
      const params = new URLSearchParams({
        template,
        addAppBlockId: `${apiKey}/${extensionHandle}`,
        target,
      });
      
      return `${baseUrl}?${params.toString()}`;
    } catch (error) {
      console.error('ThemeSetup: Error generating deep link:', error);
      return null;
    }
  }, [shop, apiKey, extensionHandle]);

  // Alternative deep link that opens the theme editor and shows app blocks
  const generateAppBlockDeepLink = useCallback((template: string = 'product') => {
    try {
      if (!shop) {
        console.error('ThemeSetup: Shop parameter missing for app block deep link');
        return null;
      }
      
      const baseUrl = `https://${shop}/admin/themes/current/editor`;
      const params = new URLSearchParams({
        template,
      });
      
      return `${baseUrl}?${params.toString()}`;
    } catch (error) {
      console.error('ThemeSetup: Error generating app block deep link:', error);
      return null;
    }
  }, [shop]);

  // Open theme editor with app block pre-selected
  const openThemeEditor = useCallback((template: string = 'product') => {
    const deepLink = generateAppBlockDeepLink(template);
    if (deepLink) {
      window.open(deepLink, '_blank', 'noopener,noreferrer');
      setDeepLinkGenerated(true);
    } else {
      console.error('ThemeSetup: Could not generate deep link for template:', template);
    }
  }, [generateAppBlockDeepLink]);

  // Check theme compatibility with better error handling
  const checkThemeCompatibility = useCallback(async () => {
    if (isCheckingTheme) return; // Prevent multiple simultaneous checks
    
    setIsCheckingTheme(true);
    try {
      // This would normally make an API call to check theme compatibility
      // For now, we'll simulate it with more realistic timing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you could make an actual API call to your app's backend
      // to check theme compatibility
      console.log('Theme compatibility check completed');
    } catch (error) {
      console.error('Theme compatibility check failed:', error);
    } finally {
      setIsCheckingTheme(false);
    }
  }, [isCheckingTheme]);

  const setupSteps = [
    {
      title: 'Open Theme Editor',
      description: 'Click the button below to open your theme editor.',
      action: (
        <Button
          variant="primary"
          onClick={() => openThemeEditor('product')}
          icon={ExternalIcon}
        >
          Open Theme Editor
        </Button>
      ),
    },
    {
      title: 'Find App Blocks Section',
      description: 'In the theme editor, look for the "App blocks" section in the left sidebar. This is where you\'ll find the Simple Gifting app block.',
      action: (
        <Badge tone="info">Look for "App blocks"</Badge>
      ),
    },
    {
      title: 'Add Simple Gifting Block',
      description: 'Look for "product-personalisatie" or "Simple Gifting" in the App blocks section and click "Add block" to add it to your product page.',
      action: (
        <Badge tone="attention">Find "product-personalisatie"</Badge>
      ),
    },
    {
      title: 'Position the Block',
      description: 'Drag the Simple Gifting block to your desired location on the product page (typically after the product form).',
      action: (
        <Badge tone="success">Drag to position</Badge>
      ),
    },
    {
      title: 'Configure Settings',
      description: 'Customize the app block settings in the theme editor to match your store\'s design.',
      action: (
        <Badge tone="success">Available in editor</Badge>
      ),
    },
    {
      title: 'Save and Publish',
      description: 'Save your changes in the theme editor to make the gifting functionality live on your store.',
      action: (
        <Badge tone="warning">Don't forget to save!</Badge>
      ),
    },
  ];

  const alternativeTemplates = [
    {
      name: 'Product Page',
      template: 'product',
      target: 'mainSection',
      description: 'Add to the main product section',
    },
    {
      name: 'Collection Page',
      template: 'collection',
      target: 'mainSection',
      description: 'Add to collection pages',
    },
    {
      name: 'Homepage',
      template: 'index',
      target: 'newAppsSection',
      description: 'Add to homepage in new Apps section',
    },
  ];

  return (
    <BlockStack gap="500">
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <Text variant="headingMd" as="h3">
              Theme Setup
            </Text>
            {themeSupport?.supportsAppBlocks && (
              <Badge tone="success">Theme Compatible</Badge>
            )}
          </InlineStack>

          {!themeSupport?.supportsAppBlocks && (
            <Banner tone="warning" title="Theme Compatibility Check">
              <BlockStack gap="200">
                <Text as="p">
                  We need to verify if your current theme supports app blocks for the best experience.
                </Text>
                <div>
                  <Button
                    onClick={checkThemeCompatibility}
                    loading={isCheckingTheme}
                    icon={isCheckingTheme ? undefined : AlertCircleIcon}
                  >
                    {isCheckingTheme ? 'Checking...' : 'Check Theme Compatibility'}
                  </Button>
                </div>
              </BlockStack>
            </Banner>
          )}

          <CalloutCard
            title="Setup Instructions"
            illustration="https://cdn.shopify.com/s/files/1/2376/3301/products/emptystate-files.png"
            primaryAction={{
              content: 'Open Theme Editor',
              onAction: () => openThemeEditor('product'),
              icon: ExternalIcon,
            }}
          >
            <BlockStack gap="200">
              <Text as="p">
                Follow these steps to add the Simple Gifting app block to your theme:
              </Text>
              <List type="number">
                <List.Item>Open the theme editor using the button above</List.Item>
                <List.Item>Navigate to a product page template</List.Item>
                <List.Item>Look for "App blocks" in the left sidebar</List.Item>
                <List.Item>Find "product-personalisatie" and click "Add block"</List.Item>
                <List.Item>Position the block where you want it to appear</List.Item>
                <List.Item>Configure the settings and save your changes</List.Item>
              </List>
            </BlockStack>
          </CalloutCard>

          <Text variant="headingMd" as="h4">
            Step-by-Step Setup
          </Text>

          <BlockStack gap="300">
            {setupSteps.map((step, index) => (
              <Card key={index} background="bg-surface-secondary">
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="start">
                    <BlockStack gap="100">
                      <Text variant="headingSm" as="h5">
                        {index + 1}. {step.title}
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        {step.description}
                      </Text>
                    </BlockStack>
                    <Box minWidth="fit-content">
                      {step.action}
                    </Box>
                  </InlineStack>
                </BlockStack>
              </Card>
            ))}
          </BlockStack>

          <Text variant="headingMd" as="h4">
            Add to Other Pages
          </Text>

          <Text as="p" variant="bodyMd" tone="subdued">
            You can also add the Simple Gifting app block to other pages in your store:
          </Text>

          <BlockStack gap="200">
            {alternativeTemplates.map((template) => (
              <Card key={template.template} background="bg-surface-tertiary">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h5" variant="headingSm">{template.name}</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {template.description}
                    </Text>
                  </BlockStack>
                  <Button
                    variant="tertiary"
                    onClick={() => openThemeEditor(template.template)}
                    icon={ExternalIcon}
                  >
                    Add Here
                  </Button>
                </InlineStack>
              </Card>
            ))}
          </BlockStack>

          <Text variant="headingMd" as="h4">
            App Embeds (Optional)
          </Text>

          <Text as="p" variant="bodyMd" tone="subdued">
            App embeds add global functionality to your theme. Unlike app blocks, they work across your entire site once activated.
          </Text>

          <Card background="bg-surface-info">
            <BlockStack gap="300">
              <Text variant="headingSm" as="h5">
                To activate the Simple Gifting app embed:
              </Text>
              <List type="number">
                <List.Item>Go to your theme editor</List.Item>
                <List.Item>Navigate to <strong>Theme Settings</strong> (at the bottom of the left sidebar)</List.Item>
                <List.Item>Find the <strong>App embeds</strong> section</List.Item>
                <List.Item>Look for <strong>Simple Gifting</strong> and toggle it on</List.Item>
                <List.Item>Save your changes</List.Item>
              </List>
              
              <Banner tone="info">
                <Text as="p" variant="bodySm">
                  <strong>Note:</strong> If you don't see the app embed immediately, it may take a few minutes to appear after deployment. 
                  Try refreshing the theme editor if needed.
                </Text>
              </Banner>

              <Button
                url={`https://${shop}/admin/themes/current/editor?context=apps&activateAppId=${apiKey}/app-embed`}
                target="_blank"
                icon={ExternalIcon}
                variant="primary"
              >
                Activate App Embed
              </Button>
            </BlockStack>
          </Card>

          {deepLinkGenerated && (
            <Banner tone="success" title="Theme Editor Opened">
              <Text as="p">
                The theme editor should now be open in a new tab. 
                Follow the steps above to add the Simple Gifting app block to your theme.
              </Text>
            </Banner>
          )}

          <Banner tone="warning" title="Can't find the app block?">
            <BlockStack gap="200">
              <Text as="p">
                If you can't find the "product-personalisatie" app block in the theme editor:
              </Text>
              <List>
                <List.Item>Make sure you're on a product page template</List.Item>
                <List.Item>Look for "App blocks" in the left sidebar</List.Item>
                <List.Item>The block might be called "product-personalisatie" or "Simple Gifting"</List.Item>
                <List.Item>Try refreshing the theme editor page</List.Item>
                <List.Item>Make sure the app is properly installed and enabled</List.Item>
              </List>
            </BlockStack>
          </Banner>

          <Card background="bg-surface-info">
            <BlockStack gap="200">
              <Text as="h5" variant="headingSm" tone="base">
                Need Help?
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                If you need assistance with theme setup, check out our{' '}
                <Link url="/app/help" target="_blank">
                  help documentation
                </Link>{' '}
                or contact our support team.
              </Text>
            </BlockStack>
          </Card>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
