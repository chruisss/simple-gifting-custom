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
      question: 'Hoe stel ik de app in voor het eerst?',
      answer: 'Ga naar het Dashboard en klik op "Initialiseer Metafields" om de benodigde product metafields aan te maken. Daarna kun je producten taggen met "gifting-card" of "gifting-ribbon" om ze geschikt te maken voor personalisatie.'
    },
    {
      id: 'products',
      question: 'Welke producten kan ik personaliseerbaar maken?',
      answer: 'Elk product in je Shopify winkel kan personaliseerbaar gemaakt worden. Voeg simpelweg de tag "gifting-card" voor kaartjes of "gifting-ribbon" voor linten toe, en configureer de metafields voor karakter limieten.'
    },
    {
      id: 'limits',
      question: 'Kan ik de karakter limiet per product instellen?',
      answer: 'Ja! Ga naar Producten > selecteer een product > bewerk de "Maximum Characters" metafield. De standaard limiet is 150 karakters, maar dit kan per product aangepast worden.'
    },
    {
      id: 'ribbons',
      question: 'Hoe werk ik met verschillende lint lengtes?',
      answer: 'Maak varianten van je lint product voor verschillende lengtes (bijv. 50cm, 100cm, 150cm). Stel de "Ribbon Length" metafield in voor elke variant.'
    },
    {
      id: 'styling',
      question: 'Kan ik het uiterlijk van de popup aanpassen?',
      answer: 'Ja, ga naar Instellingen > Uiterlijk om de popup stijl, animaties, knop kleuren en andere visuele elementen aan te passen.'
    },
    {
      id: 'disable',
      question: 'Hoe schakel ik de app tijdelijk uit?',
      answer: 'Ga naar Instellingen > Algemeen en zet de "App Status" op "Inactief". Dit verbergt alle personalisatie opties voor klanten zonder de configuratie te verliezen.'
    }
  ];

  const troubleshootingItems = [
    {
      id: 'no-popup',
      problem: 'Popup verschijnt niet op productpagina',
      solution: 'Controleer of: 1) De app is ingeschakeld in Instellingen, 2) Het product de juiste tag heeft (gifting-card/gifting-ribbon), 3) De theme extensie is geactiveerd in je theme editor.'
    },
    {
      id: 'metafields',
      problem: 'Metafields worden niet opgeslagen',
      solution: 'Zorg ervoor dat je de metafield definities hebt geïnitialiseerd via het Dashboard. Als het probleem aanhoudt, probeer de initialisatie opnieuw.'
    },
    {
      id: 'character-limit',
      problem: 'Karakter limiet werkt niet correct',
      solution: 'Controleer of de "max_chars" metafield is ingesteld voor het product. De standaard waarde is 150 karakters als geen waarde is ingesteld.'
    },
    {
      id: 'cart-not-adding',
      problem: 'Product wordt niet toegevoegd aan winkelwagen',
      solution: 'Dit kan gebeuren als het product niet beschikbaar is of geen voorraad heeft. Controleer de product status en voorraad in je Shopify admin.'
    }
  ];

  return (
    <Page title="Help & Support" subtitle="Documentatie en ondersteuning voor Simple Gifting">
      <TitleBar title="Simple Gifting - Help" />
      
      <Layout>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">Snelle links</Text>
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
                  Producten beheren
                </Button>
                <Button
                  variant="plain"
                  onClick={() => window.open('/app/settings', '_self')}
                  icon={SettingsIcon}
                >
                  Instellingen
                </Button>
                <Button
                  variant="plain"
                  onClick={() => window.open('/app/analytics', '_self')}
                  icon={BookIcon}
                >
                  Analytics
                </Button>
              </BlockStack>
              
              <Divider />
              
              <BlockStack gap="200">
                <Text as="h4" variant="headingSm">Contact & Support</Text>
                <Button
                  variant="primary"
                  onClick={() => window.open('mailto:support@simplegifting.com', '_blank')}
                  icon={EmailIcon}
                >
                  Email Support
                </Button>
                <Button
                  variant="plain"
                  onClick={() => window.open('https://docs.simplegifting.com', '_blank')}
                  icon={BookIcon}
                >
                  Volledige Documentatie
                </Button>
              </BlockStack>
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
                    <Text as="h3" variant="headingMd">Aan de slag</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Volg deze stappen om je gifting app in te stellen
                    </Text>
                  </BlockStack>
                  <Icon source={BookIcon} tone="base" />
                </InlineStack>
                
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                    <BlockStack gap="300">
                      <Text as="h4" variant="headingSm">Stap 1: Initialisatie</Text>
                      <List type="number">
                        <List.Item>Ga naar het Dashboard</List.Item>
                        <List.Item>Klik op "Initialiseer Metafields"</List.Item>
                        <List.Item>Wacht tot alle metafields zijn aangemaakt</List.Item>
                      </List>
                      
                      <Text as="h4" variant="headingSm">Stap 2: Producten instellen</Text>
                      <List type="number">
                        <List.Item>Ga naar Producten in je Shopify admin</List.Item>
                        <List.Item>Voeg tag "gifting-card" of "gifting-ribbon" toe</List.Item>
                        <List.Item>Stel karakter limiet in via metafields</List.Item>
                      </List>
                    </BlockStack>
                  </Grid.Cell>
                  
                  <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                    <BlockStack gap="300">
                      <Text as="h4" variant="headingSm">Stap 3: Theme extensie</Text>
                      <List type="number">
                        <List.Item>Ga naar je Theme Editor</List.Item>
                        <List.Item>Zoek naar "Product Personalisatie" block</List.Item>
                        <List.Item>Voeg het toe aan je product template</List.Item>
                        <List.Item>Configureer de instellingen</List.Item>
                      </List>
                      
                      <Text as="h4" variant="headingSm">Stap 4: Testen</Text>
                      <List type="number">
                        <List.Item>Ga naar een product met gifting tag</List.Item>
                        <List.Item>Test de personalisatie popup</List.Item>
                        <List.Item>Controleer winkelwagen toevoeging</List.Item>
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
                  <Text as="h3" variant="headingMd">Veelgestelde vragen</Text>
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
                  <Text as="h3" variant="headingMd">Probleemoplossing</Text>
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
                  <Text as="h3" variant="headingMd">Geavanceerde configuratie</Text>
                  <Icon source={CodeIcon} tone="base" />
                </InlineStack>
                
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                    <BlockStack gap="300">
                      <Text as="h4" variant="headingSm">Metafield referentie</Text>
                      <List type="bullet">
                        <List.Item>
                          <strong>simple_gifting.max_chars</strong> - Maximum karakters (integer)
                        </List.Item>
                        <List.Item>
                          <strong>simple_gifting.product_type</strong> - "card" of "ribbon" (text)
                        </List.Item>
                        <List.Item>
                          <strong>simple_gifting.customizable</strong> - Personaliseerbaar (boolean)
                        </List.Item>
                        <List.Item>
                          <strong>simple_gifting.ribbon_length</strong> - Lint lengte in cm (integer)
                        </List.Item>
                      </List>
                      
                      <Text as="h4" variant="headingSm">Product tags</Text>
                      <List type="bullet">
                        <List.Item><Badge>gifting-card</Badge> - Voor kaartjes</List.Item>
                        <List.Item><Badge>gifting-ribbon</Badge> - Voor linten</List.Item>
                      </List>
                    </BlockStack>
                  </Grid.Cell>
                  
                  <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                    <BlockStack gap="300">
                      <Text as="h4" variant="headingSm">API endpoints</Text>
                      <List type="bullet">
                        <List.Item>
                          <strong>/apps/gifting/cards</strong> - Alleen kaartjes
                        </List.Item>
                        <List.Item>
                          <strong>/apps/gifting/ribbons</strong> - Alleen linten
                        </List.Item>
                        <List.Item>
                          <strong>/apps/gifting/products</strong> - Alle producten
                        </List.Item>
                        <List.Item>
                          <strong>/apps/gifting/config</strong> - App configuratie
                        </List.Item>
                      </List>
                      
                      <Text as="h4" variant="headingSm">Theme blocks</Text>
                      <List type="bullet">
                        <List.Item>
                          <strong>product-personalisatie</strong> - Universele block
                        </List.Item>
                        <List.Item>
                          <strong>ribbon-personalisatie</strong> - Lint specifiek
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
                <Text as="h3" variant="headingMd">Nog steeds hulp nodig?</Text>
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 4, xl: 4 }}>
                    <BlockStack gap="200">
                      <Text as="h4" variant="headingSm">Email Support</Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Stuur ons een email met je vraag en we helpen je binnen 24 uur.
                      </Text>
                      <Button
                        variant="primary"
                        onClick={() => window.open('mailto:support@simplegifting.com', '_blank')}
                      >
                        Email versturen
                      </Button>
                    </BlockStack>
                  </Grid.Cell>
                  
                  <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 4, xl: 4 }}>
                    <BlockStack gap="200">
                      <Text as="h4" variant="headingSm">Documentatie</Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Uitgebreide handleidingen en tutorials voor alle functies.
                      </Text>
                      <Button
                        onClick={() => window.open('https://docs.simplegifting.com', '_blank')}
                      >
                        Documentatie bekijken
                      </Button>
                    </BlockStack>
                  </Grid.Cell>
                  
                  <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 4, xl: 4 }}>
                    <BlockStack gap="200">
                      <Text as="h4" variant="headingSm">Feature Request</Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Heb je een idee voor een nieuwe functie? Laat het ons weten!
                      </Text>
                      <Button
                        onClick={() => window.open('https://feedback.simplegifting.com', '_blank')}
                      >
                        Feedback geven
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