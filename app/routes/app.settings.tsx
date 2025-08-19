import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData, useNavigation, Form } from "@remix-run/react";
import { useState, useCallback, useEffect } from "react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  TextField,
  Select,
  Checkbox,
  Banner,
  Toast,
  FormLayout,
  Icon,
  Divider,
  Frame,
} from "@shopify/polaris";
import {
  SettingsIcon,
  SaveIcon
} from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getShopConfiguration, updateShopConfiguration } from "../models/ShopConfiguration.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  const config = await getShopConfiguration(shop);

  return json({
    config,
    shop
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;
  const formData = await request.formData();
  
  try {
    const configData = Object.fromEntries(formData.entries());
    
    // Convert string values to appropriate types
    const processedData: any = {};
    
    for (const [key, value] of Object.entries(configData)) {
      // Skip fields that shouldn't be updated
      if (['action', 'id', 'shop', 'createdAt', 'updatedAt', 'installationCompleted'].includes(key)) continue;
      
      // Handle boolean fields
      if (['appIsEnabled', 'autoTagging', 'debugMode'].includes(key)) {
        processedData[key] = value === 'true' || value === 'on';
      }
      // Handle number fields
      else if (['apiTimeout'].includes(key)) {
        processedData[key] = parseInt(value as string, 10);
      }
      // Handle string fields (cacheStrategy, customCss)
      else {
        processedData[key] = value;
      }
    }

    const updatedConfig = await updateShopConfiguration(shop, processedData);
    
    return json({
      success: true,
      config: updatedConfig,
      message: "Instellingen succesvol bijgewerkt!"
    });
  } catch (error) {
    console.error("Error updating configuration:", error);
    return json({
      success: false,
      error: "Fout bij het bijwerken van instellingen",
      message: error instanceof Error ? error.message : "Onbekende fout"
    }, { status: 500 });
  }
};

export default function SettingsPage() {
  const { config, shop } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  const [formData, setFormData] = useState(config);
  const [showToast, setShowToast] = useState(false);

  // Show toast on successful save
  useEffect(() => {
    if (actionData?.success && 'config' in actionData) {
      setShowToast(true);
      setFormData(actionData.config);
    }
  }, [actionData]);

  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSave = useCallback(() => {
    const form = new FormData();
    form.append('action', 'save');
    
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        form.append(key, value.toString());
      }
    });
    
    submit(form, { method: "post" });
  }, [formData, submit]);

  const toastMarkup = showToast ? (
    <Toast
      content={actionData?.message || "Instellingen opgeslagen!"}
      onDismiss={() => setShowToast(false)}
    />
  ) : null;

  return (
    <Frame>
      {toastMarkup}
      <Page
        title="App Instellingen"
        subtitle="Configureer hoe Simple Gifting werkt in je winkel"
        primaryAction={{
          content: "Opslaan",
          onAction: handleSave,
          loading: isLoading,
          icon: SaveIcon
        }}
      >
        <TitleBar title="Simple Gifting - Instellingen" />
        
        {actionData?.success === false && (
          <Layout.Section>
            <Banner tone="critical" title="Fout bij opslaan">
              <p>{actionData.message}</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout>
          <Layout.Section>
            
            {/* App Configuration */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  <Icon source={SettingsIcon} /> App Configuratie
                </Text>
                
                <FormLayout>
                  <Checkbox
                    label="App ingeschakeld"
                    helpText="Schakel Simple Gifting in of uit voor je hele winkel"
                    checked={formData.appIsEnabled}
                    onChange={(value) => handleFormChange('appIsEnabled', value)}
                  />

                  <Checkbox
                    label="Automatische tagging"
                    helpText="Voeg automatisch tags toe aan bestellingen met personalisatie"
                    checked={formData.autoTagging}
                    onChange={(value) => handleFormChange('autoTagging', value)}
                  />

                  <Select
                    label="Cache strategie"
                    value={formData.cacheStrategy}
                    onChange={(value) => handleFormChange('cacheStrategy', value)}
                    options={[
                      { label: 'Browser cache', value: 'browser' },
                      { label: 'Geen cache', value: 'none' },
                      { label: 'Server cache', value: 'server' }
                    ]}
                    helpText="Hoe de app gegevens opslaat voor betere prestaties"
                  />

                  <TextField
                    label="API timeout (seconden)"
                    type="number"
                    value={formData.apiTimeout.toString()}
                    onChange={(value) => handleFormChange('apiTimeout', parseInt(value, 10))}
                    helpText="Hoelang wachten op API responses"
                    autoComplete="off"
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            <Divider />

            {/* Advanced Settings */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Geavanceerde Instellingen
                </Text>
                
                <FormLayout>
                  <Checkbox
                    label="Debug modus"
                    helpText="Schakel uitgebreide logging in voor troubleshooting"
                    checked={formData.debugMode}
                    onChange={(value) => handleFormChange('debugMode', value)}
                  />

                  <TextField
                    label="Aangepaste CSS"
                    value={formData.customCss || ''}
                    onChange={(value) => handleFormChange('customCss', value)}
                    multiline={8}
                    helpText="Voeg aangepaste CSS toe om het uiterlijk verder aan te passen"
                    placeholder="/* Voeg hier je aangepaste CSS toe */"
                    autoComplete="off"
                  />

                  <Banner>
                    <p>
                      <strong>Let op:</strong> Geavanceerde instellingen kunnen de prestaties en 
                      het uiterlijk van je winkel beïnvloeden. Test altijd grondig voordat je 
                      wijzigingen live zet.
                    </p>
                  </Banner>
                </FormLayout>
              </BlockStack>
            </Card>

            <Divider />

            {/* Theme Editor Info */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Theme Extension Instellingen
                </Text>
                
                <Banner tone="info">
                  <BlockStack gap="200">
                    <Text variant="bodyMd" as="p" fontWeight="medium">
                      De meeste instellingen worden beheerd in de theme editor:
                    </Text>
                    <Text variant="bodyMd" as="p">
                      • Teksten en labels<br/>
                      • Kleuren en styling<br/>
                      • Product selectie en weergave<br/>
                      • Modal gedrag en animaties<br/>
                      • Knopstijlen en afmetingen
                    </Text>
                    <Text variant="bodyMd" as="p">
                      Ga naar <strong>Online Store → Themes → Customize</strong> en voeg het 
                      Simple Gifting block toe aan je product template om deze in te stellen.
                    </Text>
                  </BlockStack>
                </Banner>
              </BlockStack>
            </Card>

          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
