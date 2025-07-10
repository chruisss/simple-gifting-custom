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
    { id: "general", title: "Algemeen", icon: SettingsIcon },
    { id: "appearance", title: "Uiterlijk", icon: ViewIcon },
    { id: "text", title: "Teksten", icon: TextIcon },
    { id: "advanced", title: "Geavanceerd", icon: ColorIcon },
  ];

  return (
    <Page 
      title="Instellingen"
      subtitle="Configureer je Simple Gifting app"
      backAction={{ content: "Dashboard", onAction: () => window.location.href = "/app" }}
    >
      <Layout>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">Configuratie secties</Text>
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
                  <Text as="span" variant="bodyMd">Huidige status</Text>
                  <Badge tone={formState.appIsEnabled ? "success" : "critical"}>
                    {formState.appIsEnabled ? "Actief" : "Inactief"}
                  </Badge>
                </InlineStack>
                <Text as="p" variant="bodyMd" tone="subdued">
                  {formState.appIsEnabled 
                    ? "Klanten kunnen producten personaliseren"
                    : "Personalisatie is uitgeschakeld"
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
                        <Text as="h3" variant="headingMd">Algemene instellingen</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Basis configuratie voor je gifting app
                        </Text>
                      </BlockStack>
                      <Icon source={SettingsIcon} tone="base" />
                    </InlineStack>
                    
                    <Divider />
                    
                    <Select
                      label="App Status"
                      options={[
                        { label: "Actief - Klanten kunnen personaliseren", value: "true" },
                        { label: "Inactief - Personalisatie uitgeschakeld", value: "false" },
                      ]}
                      onChange={(value) => handleInputChange(value === "true", "appIsEnabled")}
                      value={formState.appIsEnabled.toString()}
                      helpText="Schakel de app in of uit voor alle klanten"
                    />

                    <Banner
                      title="Let op"
                      tone={formState.appIsEnabled ? "success" : "warning"}
                    >
                      <p>
                        {formState.appIsEnabled 
                          ? "De app is actief. Klanten kunnen nu producten personaliseren in je winkel."
                          : "De app is inactief. Personalisatie opties zijn verborgen voor klanten."
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
                        <Text as="h3" variant="headingMd">Uiterlijk & Gedrag</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Pas het uiterlijk van de popup aan
                        </Text>
                      </BlockStack>
                      <Icon source={ViewIcon} tone="base" />
                    </InlineStack>
                    
                    <Divider />
                    
                    {/* Color Settings */}
                    <BlockStack gap="400">
                      <Text as="h4" variant="headingSm">Kleuren</Text>
                      <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                          <BlockStack gap="400">
                                                         <TextField
                               label="Primaire kleur"
                               value={formState.primaryColor}
                               onChange={(value) => handleInputChange(value, "primaryColor")}
                               autoComplete="off"
                               helpText="Hoofdkleur voor knoppen en accenten (hex format: #2563eb)"
                               placeholder="#2563eb"
                             />
                             
                             <TextField
                               label="Secundaire kleur"
                               value={formState.secondaryColor}
                               onChange={(value) => handleInputChange(value, "secondaryColor")}
                               autoComplete="off"
                               helpText="Secundaire kleur voor gradiënten (hex format: #1d4ed8)"
                               placeholder="#1d4ed8"
                             />
                             
                             <TextField
                               label="Accent kleur"
                               value={formState.accentColor}
                               onChange={(value) => handleInputChange(value, "accentColor")}
                               autoComplete="off"
                               helpText="Accent kleur voor highlights (hex format: #059669)"
                               placeholder="#059669"
                             />
                          </BlockStack>
                        </Grid.Cell>
                        
                        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                          <BlockStack gap="400">
                                                         <TextField
                               label="Achtergrond kleur"
                               value={formState.backgroundColor}
                               onChange={(value) => handleInputChange(value, "backgroundColor")}
                               autoComplete="off"
                               helpText="Achtergrondkleur van de modal (hex format: #ffffff)"
                               placeholder="#ffffff"
                             />
                             
                             <TextField
                               label="Tekst kleur"
                               value={formState.textColor}
                               onChange={(value) => handleInputChange(value, "textColor")}
                               autoComplete="off"
                               helpText="Hoofdtekstkleur (hex format: #1e293b)"
                               placeholder="#1e293b"
                             />
                          </BlockStack>
                        </Grid.Cell>
                      </Grid>
                    </BlockStack>
                    
                    <Divider />
                    
                    {/* Font Settings */}
                    <BlockStack gap="400">
                      <Text as="h4" variant="headingSm">Lettertype</Text>
                      <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                          <BlockStack gap="400">
                            <Select
                              label="Lettertype"
                              options={[
                                { label: "Inter (Shopify standaard)", value: "Inter" },
                                { label: "Arial", value: "Arial" },
                                { label: "Helvetica", value: "Helvetica" },
                                { label: "Roboto", value: "Roboto" },
                                { label: "Open Sans", value: "Open Sans" },
                                { label: "Lato", value: "Lato" },
                                { label: "Custom", value: "Custom" },
                              ]}
                              value={formState.fontFamily}
                              onChange={(value) => handleInputChange(value, "fontFamily")}
                              helpText="Kies een lettertype voor de popup"
                            />
                            
                            {formState.fontFamily === "Custom" && (
                              <TextField
                                label="Custom lettertype URL"
                                value={formState.customFontUrl}
                                onChange={(value) => handleInputChange(value, "customFontUrl")}
                                autoComplete="off"
                                helpText="Google Fonts URL of andere lettertype URL"
                                placeholder="https://fonts.googleapis.com/css2?family=..."
                              />
                            )}
                          </BlockStack>
                        </Grid.Cell>
                        
                        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                          <BlockStack gap="400">
                            <Select
                              label="Lettergrootte"
                              options={[
                                { label: "Klein (14px)", value: "14" },
                                { label: "Normaal (16px)", value: "16" },
                                { label: "Groot (18px)", value: "18" },
                                { label: "Extra groot (20px)", value: "20" },
                              ]}
                              value={formState.fontSize}
                              onChange={(value) => handleInputChange(value, "fontSize")}
                              helpText="Basislettergrootte voor tekst"
                            />
                            
                            <Select
                              label="Lettergewicht"
                              options={[
                                { label: "Normaal (400)", value: "400" },
                                { label: "Medium (500)", value: "500" },
                                { label: "Semi-bold (600)", value: "600" },
                                { label: "Bold (700)", value: "700" },
                              ]}
                              value={formState.fontWeight}
                              onChange={(value) => handleInputChange(value, "fontWeight")}
                              helpText="Dikte van het lettertype"
                            />
                          </BlockStack>
                        </Grid.Cell>
                      </Grid>
                    </BlockStack>
                    
                    <Divider />
                    
                    <Grid>
                      <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                        <BlockStack gap="400">
                          <Text as="h4" variant="headingSm">Popup Gedrag</Text>
                          
                          <Checkbox
                            label="Popup automatisch openen"
                            checked={formState.autoOpenPopup}
                            onChange={(checked) => handleInputChange(checked, "autoOpenPopup")}
                            helpText="Open de popup automatisch wanneer klanten de productpagina bezoeken"
                          />
                          
                          <Checkbox
                            label="Blur achtergrond"
                            checked={formState.blurBackground}
                            onChange={(checked) => handleInputChange(checked, "blurBackground")}
                            helpText="Blur de achtergrond wanneer de popup open is"
                          />
                          
                          <Select
                            label="Popup animatie"
                            options={[
                              { label: "Fade in", value: "fade" },
                              { label: "Slide up", value: "slide" },
                              { label: "Zoom in", value: "zoom" },
                              { label: "Geen animatie", value: "none" },
                            ]}
                            value={formState.modalAnimation}
                            onChange={(value) => handleInputChange(value, "modalAnimation")}
                            helpText="Kies hoe de popup verschijnt"
                          />
                        </BlockStack>
                      </Grid.Cell>
                      
                      <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                        <BlockStack gap="400">
                          <Text as="h4" variant="headingSm">Knop Styling</Text>
                          
                          <Select
                            label="Knop stijl"
                            options={[
                              { label: "Primair (gebruik primaire kleur)", value: "primary" },
                              { label: "Secundair (gebruik secundaire kleur)", value: "secondary" },
                              { label: "Accent (gebruik accent kleur)", value: "accent" },
                              { label: "Custom", value: "custom" },
                            ]}
                            value={formState.buttonStyle}
                            onChange={(value) => handleInputChange(value, "buttonStyle")}
                            helpText="Kies de kleurstijl voor knoppen"
                          />
                          
                          <Select
                            label="Knop grootte"
                            options={[
                              { label: "Klein", value: "small" },
                              { label: "Gemiddeld", value: "medium" },
                              { label: "Groot", value: "large" },
                            ]}
                            value={formState.buttonSize}
                            onChange={(value) => handleInputChange(value, "buttonSize")}
                            helpText="Grootte van de personalisatie knop"
                          />
                          
                          <RangeSlider
                            label="Knop border radius"
                            value={formState.buttonBorderRadius}
                            min={0}
                            max={20}
                            onChange={(value) => handleRangeSliderChange(value, "buttonBorderRadius")}
                            output
                            suffix="px"
                            helpText="Afronding van de knop hoeken"
                          />
                        </BlockStack>
                      </Grid.Cell>
                    </Grid>
                    
                    <Divider />
                    
                    {/* Custom CSS */}
                    <BlockStack gap="400">
                      <Text as="h4" variant="headingSm">Geavanceerde Styling</Text>
                      <TextField
                        label="Custom CSS"
                        value={formState.customCss}
                        onChange={(value) => handleInputChange(value, "customCss")}
                        multiline={6}
                        autoComplete="off"
                        helpText="Voeg custom CSS toe voor geavanceerde styling. Deze CSS wordt direct in de popup toegepast."
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
                        <Text as="h3" variant="headingMd">Teksten & Labels</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Pas alle teksten in de popup aan
                        </Text>
                      </BlockStack>
                      <Icon source={TextIcon} tone="base" />
                    </InlineStack>
                    
                    <Divider />
                    
                    <Grid>
                      <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                        <BlockStack gap="400">
                          <Text as="h4" variant="headingSm">Popup Teksten</Text>
                          
                          <TextField
                            label="Popup titel"
                            value={formState.popupTitle}
                            onChange={(value) => handleInputChange(value, "popupTitle")}
                            autoComplete="off"
                            helpText="Titel die bovenaan de popup wordt getoond"
                          />
                          
                          <TextField
                            label="Toevoegen knop tekst"
                            value={formState.popupAddButtonText}
                            onChange={(value) => handleInputChange(value, "popupAddButtonText")}
                            autoComplete="off"
                            helpText="Tekst op de knop om product toe te voegen"
                          />
                          
                          <TextField
                            label="Annuleren knop tekst"
                            value={formState.popupCancelButtonText}
                            onChange={(value) => handleInputChange(value, "popupCancelButtonText")}
                            autoComplete="off"
                            helpText="Tekst op de annuleren knop"
                          />
                        </BlockStack>
                      </Grid.Cell>
                      
                      <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                        <BlockStack gap="400">
                          <Text as="h4" variant="headingSm">Aanvullende Labels</Text>
                          
                          <TextField
                            label="Bericht label"
                            value="Jouw bericht:"
                            onChange={() => {}}
                            autoComplete="off"
                            helpText="Label boven het tekstgebied"
                          />
                          
                          <TextField
                            label="Karakter teller tekst"
                            value="{current}/{max} karakters"
                            onChange={() => {}}
                            autoComplete="off"
                            helpText="Format voor de karakter teller"
                          />
                          
                          <TextField
                            label="Foutmelding te lang"
                            value="Het bericht is te lang"
                            onChange={() => {}}
                            autoComplete="off"
                            helpText="Melding wanneer bericht te lang is"
                          />
                          
                          <TextField
                            label="Succes melding"
                            value="Product toegevoegd aan winkelwagen!"
                            onChange={() => {}}
                            autoComplete="off"
                            helpText="Melding na succesvol toevoegen"
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
                        <Text as="h3" variant="headingMd">Geavanceerde instellingen</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Technische configuratie en integraties
                        </Text>
                      </BlockStack>
                      <Icon source={ColorIcon} tone="base" />
                    </InlineStack>
                    
                    <Divider />
                    
                    <Banner
                      title="Voorzichtig"
                      tone="warning"
                    >
                      <p>Deze instellingen zijn voor gevorderde gebruikers. Verkeerde configuratie kan de app functionaliteit beïnvloeden.</p>
                    </Banner>
                    
                    <Grid>
                      <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                        <BlockStack gap="400">
                          <Text as="h4" variant="headingSm">Product Instellingen</Text>
                          
                          <TextField
                            label="Standaard karakter limiet"
                            value={formState.defaultCharLimit.toString()}
                            onChange={(value) => handleInputChange(parseInt(value) || 150, "defaultCharLimit")}
                            type="number"
                            autoComplete="off"
                            helpText="Standaard maximum karakters voor nieuwe producten"
                          />
                          
                          <TextField
                            label="Gifting Product Tag"
                            value="simple-gifting-product"
                            onChange={() => {}}
                            autoComplete="off"
                            helpText="De product tag die wordt gebruikt om gifting producten te identificeren."
                            disabled
                          />
                          
                                                      <Checkbox
                              label="Automatisch taggen"
                              checked={formState.autoTagging}
                              onChange={(checked) => handleInputChange(checked, "autoTagging")}
                              helpText="Automatisch de juiste tag toevoegen aan nieuwe producten die via de app worden gemaakt."
                          />
                        </BlockStack>
                      </Grid.Cell>
                      
                      <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                        <BlockStack gap="400">
                          <Text as="h4" variant="headingSm">Integratie Instellingen</Text>
                          
                          <Checkbox
                            label="Debug modus"
                            checked={formState.debugMode}
                            onChange={(checked) => handleInputChange(checked, "debugMode")}
                            helpText="Toon debug informatie in de browser console"
                          />
                          
                          <Checkbox
                            label="Analytics tracking"
                            checked={formState.analyticsTracking}
                            onChange={(checked) => handleInputChange(checked, "analyticsTracking")}
                            helpText="Track personalisatie events voor analytics"
                          />
                          
                          <Select
                            label="Cache strategie"
                            options={[
                              { label: "Geen cache", value: "none" },
                              { label: "Browser cache", value: "browser" },
                              { label: "Server cache", value: "server" },
                              { label: "Hybrid cache", value: "hybrid" },
                            ]}
                            value={formState.cacheStrategy}
                            onChange={(value) => handleInputChange(value, "cacheStrategy")}
                            helpText="Hoe product data wordt gecached"
                          />
                          
                          <TextField
                            label="API timeout (seconden)"
                            value={formState.apiTimeout.toString()}
                            onChange={(value) => handleInputChange(parseInt(value) || 30, "apiTimeout")}
                            type="number"
                            min={5}
                            max={60}
                            autoComplete="off"
                            helpText="Timeout voor API verzoeken (5-60 seconden)"
                          />
                        </BlockStack>
                      </Grid.Cell>
                    </Grid>
                  </BlockStack>
                </Card>
              )}

              <PageActions
                primaryAction={{
                  content: "Instellingen opslaan",
                  loading: isSaving,
                  onAction: handleSave,
                }}
                secondaryActions={[
                  {
                    content: "Standaard waarden",
                    onAction: () => {
                      setFormState({
                        ...config,
                        popupTitle: "Voeg een persoonlijk bericht toe",
                        popupAddButtonText: "Kaart toevoegen",
                        popupCancelButtonText: "Annuleren",
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