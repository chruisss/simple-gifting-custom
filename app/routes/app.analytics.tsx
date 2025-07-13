import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Badge,
  Grid,
  Icon,
  Divider,
  DataTable,
  ProgressBar,
  Button,
  Select,
  DatePicker,
  Banner,
  EmptyState,
} from "@shopify/polaris";
import { 
  GiftCardIcon, 
  ProductIcon,
  CalendarIcon,
  ViewIcon
} from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useState, useCallback } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  // Get analytics data
  const productsResponse = await admin.graphql(
    `#graphql
      query getAnalyticsData {
        cards: products(first: 250, query: "tag:gifting-card") {
          edges {
            node {
              id
              title
              status
              totalInventory
              createdAt
              updatedAt
              customizable: metafield(namespace: "simple_gifting", key: "customizable") {
                value
              }
              maxChars: metafield(namespace: "simple_gifting", key: "max_chars") {
                value
              }
            }
          }
        }
        ribbons: products(first: 250, query: "tag:gifting-ribbon") {
          edges {
            node {
              id
              title
              status
              totalInventory
              createdAt
              updatedAt
              customizable: metafield(namespace: "simple_gifting", key: "customizable") {
                value
              }
              ribbonLength: metafield(namespace: "simple_gifting", key: "ribbon_length") {
                value
              }
            }
          }
        }
      }
    `
  );

  const responseJson = await productsResponse.json();
  const data = responseJson.data;
  
  const cardProducts = data.cards.edges.map((edge: any) => edge.node);
  const ribbonProducts = data.ribbons.edges.map((edge: any) => edge.node);
  
  // Calculate analytics metrics
  const totalProducts = cardProducts.length + ribbonProducts.length;
  const activeProducts = [...cardProducts, ...ribbonProducts].filter(p => p.status === 'ACTIVE').length;
  const customizableProducts = [...cardProducts, ...ribbonProducts].filter(p => p.customizable?.value === 'true').length;
  const totalInventory = [...cardProducts, ...ribbonProducts].reduce((sum, p) => sum + (p.totalInventory || 0), 0);
  
  // Mock usage data (in real app, this would come from tracking)
  const mockUsageData = {
    totalPersonalizations: 1247,
    thisMonth: 89,
    lastMonth: 156,
    avgMessageLength: 42,
    popularTimes: [
      { hour: '10:00', count: 23 },
      { hour: '14:00', count: 45 },
      { hour: '16:00', count: 67 },
      { hour: '20:00', count: 34 },
    ],
    topProducts: [
      { id: '1', title: 'Valentijn Kaartje', personalizations: 234, type: 'card' },
      { id: '2', title: 'Verjaardag Lint', personalizations: 189, type: 'ribbon' },
      { id: '3', title: 'Kerst Kaartje', personalizations: 167, type: 'card' },
      { id: '4', title: 'Bedank Kaartje', personalizations: 123, type: 'card' },
    ]
  };
  
  const analytics = {
    overview: {
      totalProducts,
      activeProducts,
      customizableProducts,
      totalInventory,
      activationRate: totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0,
      customizationRate: totalProducts > 0 ? Math.round((customizableProducts / totalProducts) * 100) : 0,
    },
    usage: mockUsageData,
    products: {
      cards: cardProducts,
      ribbons: ribbonProducts,
    }
  };

  return json({ analytics, shop: session.shop });
};

export default function AnalyticsPage() {
  const { analytics } = useLoaderData<typeof loader>();
  const [dateRange, setDateRange] = useState("last30days");
  const [selectedMetric, setSelectedMetric] = useState("personalizations");

  const handleDateRangeChange = useCallback((value: string) => {
    setDateRange(value);
  }, []);

  const handleMetricChange = useCallback((value: string) => {
    setSelectedMetric(value);
  }, []);

  const growthRate = analytics.usage.thisMonth > analytics.usage.lastMonth ? 
    Math.round(((analytics.usage.thisMonth - analytics.usage.lastMonth) / analytics.usage.lastMonth) * 100) : 0;

  const topProductsRows = analytics.usage.topProducts.map((product: any) => [
    product.title,
    product.type === 'card' ? 'Card' : 'Ribbon',
    product.personalizations,
    <ProgressBar 
      key={product.id}
      progress={Math.round((product.personalizations / analytics.usage.topProducts[0].personalizations) * 100)} 
      size="small"
    />
  ]);

  return (
    <Page title="Analytics" subtitle="Insights into your gifting app performance">
      <TitleBar title="Simple Gifting - Analytics" />
      
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h3" variant="headingMd">Overview period</Text>
                <InlineStack gap="200">
                  <Select
                    label=""
                    options={[
                      { label: "Last 7 days", value: "last7days" },
                      { label: "Last 30 days", value: "last30days" },
                      { label: "Last 90 days", value: "last90days" },
                      { label: "This year", value: "thisyear" },
                    ]}
                    value={dateRange}
                    onChange={handleDateRangeChange}
                  />
                  <Select
                    label=""
                    options={[
                      { label: "Personalizations", value: "personalizations" },
                      { label: "Products", value: "products" },
                      { label: "Revenue", value: "revenue" },
                    ]}
                    value={selectedMetric}
                    onChange={handleMetricChange}
                  />
                </InlineStack>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
              <Card>
                <BlockStack gap="300">
                  <InlineStack align="space-between">
                    <InlineStack gap="200">
                      <Icon source={ViewIcon} tone="base" />
                      <Text as="h3" variant="headingMd">Personalizations</Text>
                    </InlineStack>
                    <Text as="p" variant="heading2xl">{analytics.usage.totalPersonalizations.toString()}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      This month: {analytics.usage.thisMonth}
                    </Text>
                    <Badge tone={growthRate > 0 ? "success" : "critical"}>
                      {`${growthRate > 0 ? '+' : ''}${growthRate}%`}
                    </Badge>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Grid.Cell>
            
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
              <Card>
                <BlockStack gap="300">
                  <InlineStack align="space-between">
                    <InlineStack gap="200">
                      <Icon source={GiftCardIcon} tone="base" />
                      <Text as="h3" variant="headingMd">Active Products</Text>
                    </InlineStack>
                    <Text as="p" variant="heading2xl">{analytics.overview.activeProducts.toString()}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      of {analytics.overview.totalProducts} total
                    </Text>
                    <Badge tone="info">
                      {`${analytics.overview.activationRate}% active`}
                    </Badge>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Grid.Cell>
            
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
              <Card>
                <BlockStack gap="300">
                  <InlineStack align="space-between">
                    <InlineStack gap="200">
                      <Icon source={ProductIcon} tone="base" />
                      <Text as="h3" variant="headingMd">Customizable</Text>
                    </InlineStack>
                    <Text as="p" variant="heading2xl">{analytics.overview.customizableProducts}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Can be customized
                    </Text>
                    <Badge tone="success">
                      {`${analytics.overview.customizationRate}%`}
                    </Badge>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Grid.Cell>
            
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
              <Card>
                <BlockStack gap="300">
                  <InlineStack align="space-between">
                    <InlineStack gap="200">
                      <Icon source={ViewIcon} tone="base" />
                      <Text as="h3" variant="headingMd">Avg. Message</Text>
                    </InlineStack>
                    <Text as="p" variant="heading2xl">{analytics.usage.avgMessageLength}</Text>
                  </InlineStack>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    characters per message
                  </Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
          </Grid>
        </Layout.Section>

        <Layout.Section>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 8, xl: 8 }}>
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">Most Popular Products</Text>
                  <DataTable
                    columnContentTypes={['text', 'text', 'numeric', 'text']}
                    headings={['Product', 'Type', 'Personalizations', 'Popularity']}
                    rows={topProductsRows}
                  />
                </BlockStack>
              </Card>
            </Grid.Cell>
            
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 4, xl: 4 }}>
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">Peak Times</Text>
                  <BlockStack gap="300">
                    {analytics.usage.popularTimes.map((time: any, index: number) => (
                      <InlineStack key={index} align="space-between">
                        <Text as="span" variant="bodyMd">{time.hour}</Text>
                        <InlineStack gap="200">
                          <Text as="span" variant="bodyMd">{time.count}</Text>
                          <ProgressBar 
                            progress={Math.round((time.count / 70) * 100)} 
                            size="small"
                          />
                        </InlineStack>
                      </InlineStack>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Card>
            </Grid.Cell>
          </Grid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h3" variant="headingMd">Performance trends</Text>
                <Button variant="primary" onClick={() => {
                  const shopName = window.location.href.includes('van-bieren') ? 'van-bieren' : 'your-shop';
                  window.open(`https://admin.shopify.com/store/${shopName}/analytics`, '_blank');
                }}>
                  Shopify Analytics
                </Button>
              </InlineStack>
              <Banner
                title="Advanced analytics coming soon"
                tone="info"
              >
                <p>We are working on advanced analytics with charts, conversion tracking, and more detailed reports.</p>
              </Banner>
              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                  <BlockStack gap="300">
                    <Text as="h4" variant="headingSm">Upcoming features</Text>
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">• Conversion tracking from personalizations to sales</Text>
                      <Text as="p" variant="bodyMd">• Geographic distribution of personalizations</Text>
                      <Text as="p" variant="bodyMd">• Most popular words in messages</Text>
                      <Text as="p" variant="bodyMd">• Seasonal trends and patterns</Text>
                      <Text as="p" variant="bodyMd">• A/B testing for popup variants</Text>
                    </BlockStack>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                  <BlockStack gap="300">
                    <Text as="h4" variant="headingSm">Export data</Text>
                    <BlockStack gap="200">
                      <Button size="slim" onClick={() => {}}>
                        Download CSV report
                      </Button>
                      <Button size="slim" onClick={() => {}}>
                        Email monthly report
                      </Button>
                      <Button size="slim" onClick={() => {}}>
                        Integrate with Google Analytics
                      </Button>
                    </BlockStack>
                  </BlockStack>
                </Grid.Cell>
              </Grid>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}