import { Page, Layout, Text, Card, BlockStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function Help() {
  return (
    <Page>
      <TitleBar title="Help" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Help & Support</Text>
              <Text as="p" variant="bodyMd">
                This page is temporarily unavailable. Please check back later.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}