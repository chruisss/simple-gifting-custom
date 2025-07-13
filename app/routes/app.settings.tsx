import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigation, Form, useSubmit } from "@remix-run/react";
import {
  Card,
  BlockStack,
  Page,
  Layout,
  Text,
  TextField,
  Select,
  PageActions,
  Divider,
  InlineStack,
  Badge,
  Checkbox,
  RangeSlider,
  ButtonGroup,
  Button,
  Banner,
  Grid,
  Icon,
  Collapsible,
  ChoiceList,
  ColorPicker,
  hsbToHex,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import type { ShopConfiguration } from "@prisma/client";
import { SettingsIcon, ColorIcon, TextIcon, ViewIcon } from "@shopify/polaris-icons";

import { authenticate } from "../shopify.server";
import {
  getShopConfiguration,
  updateShopConfiguration,
} from "../models/ShopConfiguration.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const config = await getShopConfiguration(session.shop);
  return json({ config });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const data = {
    popupTitle: formData.get("popupTitle") as string,
    popupAddButtonText: formData.get("popupAddButtonText") as string,
    popupCancelButtonText: formData.get("popupCancelButtonText") as string,
    appIsEnabled: formData.get("appIsEnabled") === "true",
    defaultCharLimit: parseInt(formData.get("defaultCharLimit") as string) || 150,
    autoTagging: formData.get("autoTagging") === "true",
    debugMode: formData.get("debugMode") === "true",
    analyticsTracking: formData.get("analyticsTracking") === "true",
    cacheStrategy: formData.get("cacheStrategy") as string || "browser",
    apiTimeout: parseInt(formData.get("apiTimeout") as string) || 30,
    // Styling fields
    primaryColor: formData.get("primaryColor") as string || "#2563eb",
    secondaryColor: formData.get("secondaryColor") as string || "#1d4ed8",
    accentColor: formData.get("accentColor") as string || "#059669",
    backgroundColor: formData.get("backgroundColor") as string || "#ffffff",
    textColor: formData.get("textColor") as string || "#1e293b",
    buttonStyle: formData.get("buttonStyle") as string || "primary",
    buttonSize: formData.get("buttonSize") as string || "medium",
    buttonBorderRadius: parseInt(formData.get("buttonBorderRadius") as string) || 12,
    fontFamily: formData.get("fontFamily") as string || "Inter",
    fontSize: formData.get("fontSize") as string || "16",
    fontWeight: formData.get("fontWeight") as string || "500",
    modalAnimation: formData.get("modalAnimation") as string || "fade",
    autoOpenPopup: formData.get("autoOpenPopup") === "true",
    blurBackground: formData.get("blurBackground") === "true",
    customCss: formData.get("customCss") as string || null,
    customFontUrl: formData.get("customFontUrl") as string || null,
  };

  await updateShopConfiguration(session.shop, data);

  return redirect("/app/settings");
};

export default function SettingsPage() {
  const { config } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submit = useSubmit();

  const [formState, setFormState] = useState({
    ...config,
    // Ensure all fields are included with proper defaults
    defaultCharLimit: config.defaultCharLimit || 150,
    autoTagging: config.autoTagging ?? true,
    debugMode: config.debugMode ?? false,
    analyticsTracking: config.analyticsTracking ?? true,
    cacheStrategy: config.cacheStrategy || "browser",
    apiTimeout: config.apiTimeout || 30,
    // Styling fields with defaults
    primaryColor: (config as any).primaryColor || "#2563eb",
    secondaryColor: (config as any).secondaryColor || "#1d4ed8",
    accentColor: (config as any).accentColor || "#059669",
    backgroundColor: (config as any).backgroundColor || "#ffffff",
    textColor: (config as any).textColor || "#1e293b",
    buttonStyle: (config as any).buttonStyle || "primary",
    buttonSize: (config as any).buttonSize || "medium",
    buttonBorderRadius: (config as any).buttonBorderRadius || 12,
    fontFamily: (config as any).fontFamily || "Inter",
    fontSize: (config as any).fontSize || "16",
    fontWeight: (config as any).fontWeight || "500",
    modalAnimation: (config as any).modalAnimation || "fade",
    autoOpenPopup: (config as any).autoOpenPopup ?? false,
    blurBackground: (config as any).blurBackground ?? true,
    customCss: (config as any).customCss || "",
    customFontUrl: (config as any).customFontUrl || "",
  });
  const [activeSection, setActiveSection] = useState<string>("general");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isSaving = navigation.state === "submitting";

  const handleInputChange = useCallback(
    (value: string | boolean | number, name: keyof typeof formState) => {
      setFormState((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleRangeSliderChange = useCallback(
    (value: number | [number, number], name: keyof typeof formState) => {
      const singleValue = Array.isArray(value) ? value[0] : value;
      setFormState((prev) => ({ ...prev, [name]: singleValue }));
    },
    []
  );

  const handleColorChange = useCallback(
    (color: any, name: keyof typeof formState) => {
      const hexColor = hsbToHex(color);
      setFormState((prev) => ({ ...prev, [name]: hexColor }));
    },
    []
  );

  const handleSave = () => {
    const formData = new FormData();
    // Basic fields
    formData.append("popupTitle", formState.popupTitle);
    formData.append("popupAddButtonText", formState.popupAddButtonText);
    formData.append("popupCancelButtonText", formState.popupCancelButtonText);
    formData.append("appIsEnabled", formState.appIsEnabled.toString());
    formData.append("defaultCharLimit", formState.defaultCharLimit.toString());
    formData.append("autoTagging", formState.autoTagging.toString());
    formData.append("debugMode", formState.debugMode.toString());
    formData.append("analyticsTracking", formState.analyticsTracking.toString());
    formData.append("cacheStrategy", formState.cacheStrategy);
    formData.append("apiTimeout", formState.apiTimeout.toString());
    
    // Styling fields
    formData.append("primaryColor", formState.primaryColor);
    formData.append("secondaryColor", formState.secondaryColor);
    formData.append("accentColor", formState.accentColor);
    formData.append("backgroundColor", formState.backgroundColor);
    formData.append("textColor", formState.textColor);
    formData.append("buttonStyle", formState.buttonStyle);
    formData.append("buttonSize", formState.buttonSize);
    formData.append("buttonBorderRadius", formState.buttonBorderRadius.toString());
    formData.append("fontFamily", formState.fontFamily);
    formData.append("fontSize", formState.fontSize);
    formData.append("fontWeight", formState.fontWeight);
    formData.append("modalAnimation", formState.modalAnimation);
    formData.append("autoOpenPopup", formState.autoOpenPopup.toString());
    formData.append("blurBackground", formState.blurBackground.toString());
    formData.append("customCss", formState.customCss);
    formData.append("customFontUrl", formState.customFontUrl);
    
    submit(formData, { method: "post" });
  };

  const sections = [
    { id: "general", title: "General", icon: SettingsIcon },
    { id: "appearance", title: "Appearance", icon: ViewIcon },
    { id: "text", title: "Texts", icon: TextIcon },
    { id: "advanced", title: "Advanced", icon: ColorIcon },
  ];

  return (
    <Page 
      title="Settings"
      subtitle="Configure your Simple Gifting app"
      backAction={{ content: "Dashboard", onAction: () => window.location.href = "/app" }}
    >
      <Layout>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">Configuration sections</Text>
              <ButtonGroup>
                {sections.map((section) => (
                  <Button
                    key={section.id}
                    pressed={activeSection === section.id}
                    onClick={() => setActiveSection(section.id)}
                    size="slim"
                  >
                    {section.title}
                  </Button>
                ))}
              </ButtonGroup>
              
              <Divider />
              
              <BlockStack gap="200">
                <Text as="h4" variant="headingSm">App Status</Text>
                <InlineStack align="space-between">
                  <Text as="span" variant="bodyMd">Current status</Text>
                  <Badge tone={formState.appIsEnabled ? "success" : "critical"}>
                    {formState.appIsEnabled ? "Active" : "Inactive"}
                  </Badge>
                </InlineStack>
                <Text as="p" variant="bodyMd" tone="subdued">
                  {formState.appIsEnabled 
                    ? "Customers can personalize products"
                    : "Personalization is disabled"
                  }
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Form onSubmit={handleSave}>
            <BlockStack gap="500">
              
              {/* General Settings */}
              {activeSection === "general" && (
                <Card>
                  <BlockStack gap="500">
                    <InlineStack align="space-between">
                      <BlockStack gap="200">
                        <Text as="h3" variant="headingMd">General settings</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Basic configuration for your gifting app
                        </Text>
                      </BlockStack>
                      <Icon source={SettingsIcon} tone="base" />
                    </InlineStack>
                    
                    <Divider />
                    
                    <Select
                      label="App Status"
                      options={[
                        { label: "Active - Customers can personalize", value: "true" },
                        { label: "Inactive - Personalization disabled", value: "false" },
                      ]}
                      onChange={(value) => handleInputChange(value === "true", "appIsEnabled")}
                      value={formState.appIsEnabled.toString()}
                      helpText="Enable or disable the app for all customers"
                    />

                    <Banner
                      title="Caution"
                      tone={formState.appIsEnabled ? "success" : "warning"}
                    >
                      <p>
                        {formState.appIsEnabled 
                          ? "The app is active. Customers can now personalize products in your store."
                          : "The app is inactive. Personalization options are hidden from customers."
                        }
                      </p>
                    </Banner>
                  </BlockStack>
                </Card>
              )}

              {/* Appearance Settings */}
              {activeSection === "appearance" && (
                <Card>
                  <BlockStack gap="500">
                    <InlineStack align="space-between">
                      <BlockStack gap="200">
                        <Text as="h3" variant="headingMd">Appearance & Behavior</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Customize the appearance of the popup
                        </Text>
                      </BlockStack>
                      <Icon source={ViewIcon} tone="base" />
                    </InlineStack>
                    
                    <Divider />
                    
                    {/* Color Settings */}
                    <BlockStack gap="400">
                      <Text as="h4" variant="headingSm">Colors</Text>
                      <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                          <BlockStack gap="400">
                                                         <TextField
                               label="Primary color"
                               value={formState.primaryColor}
                               onChange={(value) => handleInputChange(value, "primaryColor")}
                               autoComplete="off"
                               helpText="Primary color for buttons and accents (hex format: #2563eb)"
                               placeholder="#2563eb"
                             />
                             
                             <TextField
                               label="Secondary color"
                               value={formState.secondaryColor}
                               onChange={(value) => handleInputChange(value, "secondaryColor")}
                               autoComplete="off"
                               helpText="Secondary color for gradients (hex format: #1d4ed8)"
                               placeholder="#1d4ed8"
                             />
                             
                             <TextField
                               label="Accent color"
                               value={formState.accentColor}
                               onChange={(value) => handleInputChange(value, "accentColor")}
                               autoComplete="off"
                               helpText="Accent color for highlights (hex format: #059669)"
                               placeholder="#059669"
                             />
                          </BlockStack>
                        </Grid.Cell>
                        
                        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                          <BlockStack gap="400">
                                                         <TextField
                               label="Background color"
                               value={formState.backgroundColor}
                               onChange={(value) => handleInputChange(value, "backgroundColor")}
                               autoComplete="off"
                               helpText="Background color of the modal (hex format: #ffffff)"
                               placeholder="#ffffff"
                             />
                             
                             <TextField
                               label="Text color"
                               value={formState.textColor}
                               onChange={(value) => handleInputChange(value, "textColor")}
                               autoComplete="off"
                               helpText="Main text color (hex format: #1e293b)"
                               placeholder="#1e293b"
                             />
                          </BlockStack>
                        </Grid.Cell>
                      </Grid>
                    </BlockStack>
                    
                    <Divider />
                    
                    {/* Font Settings */}
                    <BlockStack gap="400">
                      <Text as="h4" variant="headingSm">Font</Text>
                      <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                          <BlockStack gap="400">
                            <Select
                              label="Font"
                              options={[
                                { label: "Inter (Shopify default)", value: "Inter" },
                                { label: "Arial", value: "Arial" },
                                { label: "Helvetica", value: "Helvetica" },
                                { label: "Roboto", value: "Roboto" },
                                { label: "Open Sans", value: "Open Sans" },
                                { label: "Lato", value: "Lato" },
                                { label: "Custom", value: "Custom" },
                              ]}
                              value={formState.fontFamily}
                              onChange={(value) => handleInputChange(value, "fontFamily")}
                              helpText="Choose a font for the popup"
                            />
                            
                            {formState.fontFamily === "Custom" && (
                              <TextField
                                label="Custom font URL"
                                value={formState.customFontUrl}
                                onChange={(value) => handleInputChange(value, "customFontUrl")}
                                autoComplete="off"
                                helpText="Google Fonts URL or other font URL"
                                placeholder="https://fonts.googleapis.com/css2?family=..."
                              />
                            )}
                          </BlockStack>
                        </Grid.Cell>
                        
                        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                          <BlockStack gap="400">
                            <Select
                              label="Font size"
                              options={[
                                { label: "Small (14px)", value: "14" },
                                { label: "Normal (16px)", value: "16" },
                                { label: "Large (18px)", value: "18" },
                                { label: "Extra large (20px)", value: "20" },
                              ]}
                              value={formState.fontSize}
                              onChange={(value) => handleInputChange(value, "fontSize")}
                              helpText="Base font size for text"
                            />
                            
                            <Select
                              label="Font weight"
                              options={[
                                { label: "Normal (400)", value: "400" },
                                { label: "Medium (500)", value: "500" },
                                { label: "Semi-bold (600)", value: "600" },
                                { label: "Bold (700)", value: "700" },
                              ]}
                              value={formState.fontWeight}
                              onChange={(value) => handleInputChange(value, "fontWeight")}
                              helpText="Thickness of the font"
                            />
                          </BlockStack>
                        </Grid.Cell>
                      </Grid>
                    </BlockStack>
                    
                    <Divider />
                    
                    <Grid>
                      <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                        <BlockStack gap="400">
                          <Text as="h4" variant="headingSm">Popup Behavior</Text>
                          
                          <Checkbox
                            label="Automatically open popup"
                            checked={formState.autoOpenPopup}
                            onChange={(checked) => handleInputChange(checked, "autoOpenPopup")}
                            helpText="Automatically open the popup when customers visit the product page"
                          />
                          
                          <Checkbox
                            label="Blur background"
                            checked={formState.blurBackground}
                            onChange={(checked) => handleInputChange(checked, "blurBackground")}
                            helpText="Blur the background when the popup is open"
                          />
                          
                          <Select
                            label="Popup animation"
                            options={[
                              { label: "Fade in", value: "fade" },
                              { label: "Slide up", value: "slide" },
                              { label: "Zoom in", value: "zoom" },
                              { label: "No animation", value: "none" },
                            ]}
                            value={formState.modalAnimation}
                            onChange={(value) => handleInputChange(value, "modalAnimation")}
                            helpText="Choose how the popup appears"
                          />
                        </BlockStack>
                      </Grid.Cell>
                      
                      <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                        <BlockStack gap="400">
                          <Text as="h4" variant="headingSm">Button Styling</Text>
                          
                          <Select
                            label="Button style"
                            options={[
                              { label: "Primary (use primary color)", value: "primary" },
                              { label: "Secondary (use secondary color)", value: "secondary" },
                              { label: "Accent (use accent color)", value: "accent" },
                              { label: "Custom", value: "custom" },
                            ]}
                            value={formState.buttonStyle}
                            onChange={(value) => handleInputChange(value, "buttonStyle")}
                            helpText="Choose the color style for buttons"
                          />
                          
                          <Select
                            label="Button size"
                            options={[
                              { label: "Small", value: "small" },
                              { label: "Medium", value: "medium" },
                              { label: "Large", value: "large" },
                            ]}
                            value={formState.buttonSize}
                            onChange={(value) => handleInputChange(value, "buttonSize")}
                            helpText="Size of the personalization button"
                          />
                          
                          <RangeSlider
                            label="Button border radius"
                            value={formState.buttonBorderRadius}
                            min={0}
                            max={20}
                            onChange={(value) => handleRangeSliderChange(value, "buttonBorderRadius")}
                            output
                            suffix="px"
                            helpText="Roundness of the button corners"
                          />
                        </BlockStack>
                      </Grid.Cell>
                    </Grid>
                    
                    <Divider />
                    
                    {/* Custom CSS */}
                    <BlockStack gap="400">
                      <Text as="h4" variant="headingSm">Advanced Styling</Text>
                      <TextField
                        label="Custom CSS"
                        value={formState.customCss}
                        onChange={(value) => handleInputChange(value, "customCss")}
                        multiline={6}
                        autoComplete="off"
                        helpText="Add custom CSS for advanced styling. This CSS is applied directly in the popup."
                        placeholder=".gifting-modal-content { border: 2px solid #000; }"
                      />
                    </BlockStack>
                  </BlockStack>
                </Card>
              )}

              {/* Text Settings */}
              {activeSection === "text" && (
                <Card>
                  <BlockStack gap="500">
                    <InlineStack align="space-between">
                      <BlockStack gap="200">
                        <Text as="h3" variant="headingMd">Texts & Labels</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Adjust all texts in the popup
                        </Text>
                      </BlockStack>
                      <Icon source={TextIcon} tone="base" />
                    </InlineStack>
                    
                    <Divider />
                    
                    <Grid>
                      <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                        <BlockStack gap="400">
                          <Text as="h4" variant="headingSm">Popup Texts</Text>
                          
                          <TextField
                            label="Popup title"
                            value={formState.popupTitle}
                            onChange={(value) => handleInputChange(value, "popupTitle")}
                            autoComplete="off"
                            helpText="Title displayed at the top of the popup"
                          />
                          
                          <TextField
                            label="Add button text"
                            value={formState.popupAddButtonText}
                            onChange={(value) => handleInputChange(value, "popupAddButtonText")}
                            autoComplete="off"
                            helpText="Text on the button to add the product"
                          />
                          
                          <TextField
                            label="Cancel button text"
                            value={formState.popupCancelButtonText}
                            onChange={(value) => handleInputChange(value, "popupCancelButtonText")}
                            autoComplete="off"
                            helpText="Text on the cancel button"
                          />
                        </BlockStack>
                      </Grid.Cell>
                      
                      <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                        <BlockStack gap="400">
                          <Text as="h4" variant="headingSm">Additional Labels</Text>
                          
                          <TextField
                            label="Message label"
                            value="Your message:"
                            onChange={() => {}}
                            autoComplete="off"
                            helpText="Label above the text area"
                          />
                          
                          <TextField
                            label="Character counter text"
                            value="{current}/{max} characters"
                            onChange={() => {}}
                            autoComplete="off"
                            helpText="Format for the character counter"
                          />
                          
                          <TextField
                            label="Error message too long"
                            value="The message is too long"
                            onChange={() => {}}
                            autoComplete="off"
                            helpText="Message when the message is too long"
                          />
                          
                          <TextField
                            label="Success message"
                            value="Product added to cart!"
                            onChange={() => {}}
                            autoComplete="off"
                            helpText="Message after successful addition"
                          />
                        </BlockStack>
                      </Grid.Cell>
                    </Grid>
                  </BlockStack>
                </Card>
              )}

              {/* Advanced Settings */}
              {activeSection === "advanced" && (
                <Card>
                  <BlockStack gap="500">
                    <InlineStack align="space-between">
                      <BlockStack gap="200">
                        <Text as="h3" variant="headingMd">Advanced settings</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Technical configuration and integrations
                        </Text>
                      </BlockStack>
                      <Icon source={ColorIcon} tone="base" />
                    </InlineStack>
                    
                    <Divider />
                    
                    <Banner
                      title="Caution"
                      tone="warning"
                    >
                      <p>These settings are for advanced users. Incorrect configuration may affect app functionality.</p>
                    </Banner>
                    
                    <Grid>
                      <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                        <BlockStack gap="400">
                          <Text as="h4" variant="headingSm">Product Settings</Text>
                          
                          <TextField
                            label="Default character limit"
                            value={formState.defaultCharLimit.toString()}
                            onChange={(value) => handleInputChange(parseInt(value) || 150, "defaultCharLimit")}
                            type="number"
                            autoComplete="off"
                            helpText="Default maximum characters for new products"
                          />
                          
                          <TextField
                            label="Gifting Product Tag"
                            value="simple-gifting-product"
                            onChange={() => {}}
                            autoComplete="off"
                            helpText="The product tag used to identify gifting products."
                            disabled
                          />
                          
                                                      <Checkbox
                              label="Automatic tagging"
                              checked={formState.autoTagging}
                              onChange={(checked) => handleInputChange(checked, "autoTagging")}
                              helpText="Automatically add the correct tag to new products created via the app."
                          />
                        </BlockStack>
                      </Grid.Cell>
                      
                      <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                        <BlockStack gap="400">
                          <Text as="h4" variant="headingSm">Integration Settings</Text>
                          
                          <Checkbox
                            label="Debug mode"
                            checked={formState.debugMode}
                            onChange={(checked) => handleInputChange(checked, "debugMode")}
                            helpText="Show debug information in the browser console"
                          />
                          
                          <Checkbox
                            label="Analytics tracking"
                            checked={formState.analyticsTracking}
                            onChange={(checked) => handleInputChange(checked, "analyticsTracking")}
                            helpText="Track personalization events for analytics"
                          />
                          
                          <Select
                            label="Cache strategy"
                            options={[
                              { label: "No cache", value: "none" },
                              { label: "Browser cache", value: "browser" },
                              { label: "Server cache", value: "server" },
                              { label: "Hybrid cache", value: "hybrid" },
                            ]}
                            value={formState.cacheStrategy}
                            onChange={(value) => handleInputChange(value, "cacheStrategy")}
                            helpText="How product data is cached"
                          />
                          
                          <TextField
                            label="API timeout (seconds)"
                            value={formState.apiTimeout.toString()}
                            onChange={(value) => handleInputChange(parseInt(value) || 30, "apiTimeout")}
                            type="number"
                            min={5}
                            max={60}
                            autoComplete="off"
                            helpText="Timeout for API requests (5-60 seconds)"
                          />
                        </BlockStack>
                      </Grid.Cell>
                    </Grid>
                  </BlockStack>
                </Card>
              )}

              <PageActions
                primaryAction={{
                  content: "Save settings",
                  loading: isSaving,
                  onAction: handleSave,
                }}
                secondaryActions={[
                  {
                    content: "Default values",
                    onAction: () => {
                      setFormState({
                        ...config,
                        popupTitle: "Add a personal message",
                        popupAddButtonText: "Add card",
                        popupCancelButtonText: "Cancel",
                        defaultCharLimit: 150,
                        autoTagging: true,
                        debugMode: false,
                        analyticsTracking: true,
                        cacheStrategy: "browser",
                        apiTimeout: 30,
                        // Styling fields with defaults
                        primaryColor: "#2563eb",
                        secondaryColor: "#1d4ed8",
                        accentColor: "#059669",
                        backgroundColor: "#ffffff",
                        textColor: "#1e293b",
                        buttonStyle: "primary",
                        buttonSize: "medium",
                        buttonBorderRadius: 12,
                        fontFamily: "Inter",
                        fontSize: "16",
                        fontWeight: "500",
                        modalAnimation: "fade",
                        autoOpenPopup: false,
                        blurBackground: true,
                        customCss: "",
                        customFontUrl: "",
                      });
                    },
                  },
                ]}
              />
            </BlockStack>
          </Form>
        </Layout.Section>
      </Layout>
    </Page>
  );
}