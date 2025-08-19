import { json } from "@remix-run/node";

export interface ThemeCompatibility {
  supportsAppBlocks: boolean;
  themeId: string;
  themeName: string;
  supportedTemplates: string[];
  mainSections: Array<{
    template: string;
    section: string;
    supportsAppBlocks: boolean;
  }>;
}

export async function checkThemeCompatibility(
  admin: any,
  extensionHandle: string
): Promise<ThemeCompatibility> {
  const APP_BLOCK_TEMPLATES = ["product", "collection", "index"];
  
  try {
    // Get main theme ID
    const getMainThemeId = `
      query getMainThemeId {
        themes(first: 1, roles: [MAIN]) {
          nodes {
            id
            name
          }
        }
      }
    `;

    let response;
    let data;
    
    try {
      response = await admin.graphql(getMainThemeId);
      data = await response.json();
    } catch (graphqlError: any) {
      // Handle GraphQL errors (like missing read_themes scope)
      if (graphqlError.message && 
          (graphqlError.message.includes('read_themes') || 
           graphqlError.message.includes('Access denied for themes'))) {
        console.warn('Theme compatibility check skipped: read_themes scope not available');
        return {
          supportsAppBlocks: true, // Assume compatibility since we can't check
          themeId: 'unknown',
          themeName: 'Unknown Theme',
          supportedTemplates: APP_BLOCK_TEMPLATES,
          mainSections: [],
        };
      }
      throw graphqlError; // Re-throw if it's not a theme access error
    }
    
    // Check if we have access to themes in the response
    if (data.errors) {
      const hasThemeError = data.errors.some((error: any) => 
        error.message.includes('read_themes') || 
        error.message.includes('Access denied for themes')
      );
      
      if (hasThemeError) {
        console.warn('Theme compatibility check skipped: read_themes scope not available');
        return {
          supportsAppBlocks: true, // Assume compatibility since we can't check
          themeId: 'unknown',
          themeName: 'Unknown Theme',
          supportedTemplates: APP_BLOCK_TEMPLATES,
          mainSections: [],
        };
      }
    }
    
    const theme = data.data.themes.nodes[0];
    
    if (!theme) {
      throw new Error("No main theme found");
    }

    const themeId = theme.id;
    const themeName = theme.name;

    // Retrieve the JSON templates that we want to integrate with
    const getFilesQuery = `
      query getFiles($filenames: [String!]!, $themeId: ID!) {
        theme(id: $themeId) {
          files(filenames: $filenames) {
            nodes {
              filename
              body {
                ... on OnlineStoreThemeFileBodyText { content }
                ... on OnlineStoreThemeFileBodyBase64 { contentBase64 }
              }
            }
          }
        }
      }
    `;

    const filesResponse = await admin.graphql(getFilesQuery, {
      variables: {
        themeId: themeId,
        filenames: APP_BLOCK_TEMPLATES.map((f) => `templates/${f}.json`),
      },
    });

    const filesData = await filesResponse.json();
    const jsonTemplateFiles = filesData.data.theme.files.nodes;

    // Check if all desired templates support sections everywhere
    const hasAllTemplates = jsonTemplateFiles.length === APP_BLOCK_TEMPLATES.length;
    
    if (!hasAllTemplates) {
      return {
        supportsAppBlocks: false,
        themeId,
        themeName,
        supportedTemplates: [],
        mainSections: [],
      };
    }

    const jsonTemplateData = jsonTemplateFiles.map((file: any) => {
      try {
        // Skip files that don't contain valid JSON (e.g., files with comments)
        const content = file.body.content.trim();
        if (!content.startsWith('{') && !content.startsWith('[')) {
          console.log(`Skipping non-JSON file: ${file.filename}`);
          return null;
        }
        
        return { 
          filename: file.filename, 
          body: JSON.parse(content) 
        };
      } catch (error) {
        console.error(`Error parsing JSON for ${file.filename}:`, error);
        return null;
      }
    }).filter(Boolean); // Remove null entries

    // Retrieve the body of JSON templates and find what section is set as `main`
    const templateMainSections = jsonTemplateData
      .map((file: any) => {
        const main = Object.entries(file.body.sections).find(
          ([id, section]: [string, any]) => id === "main" || section.type.startsWith("main-")
        );
        if (main) {
          return {
            template: file.filename.replace('templates/', '').replace('.json', ''),
            section: "sections/" + (main[1] as any).type + ".liquid"
          };
        }
        return null;
      })
      .filter((section: any) => section);

    // Get the main section files to check for app block support
    const sectionFilenames = templateMainSections.map((s: any) => s.section);
    
    const sectionsResponse = await admin.graphql(getFilesQuery, {
      variables: { 
        themeId: themeId, 
        filenames: sectionFilenames 
      },
    });

    const sectionsData = await sectionsResponse.json();
    const sectionFiles = sectionsData.data.theme.files.nodes;

    // Check which sections support app blocks
    const sectionsWithAppBlock = sectionFiles.map((file: any) => {
      let acceptsAppBlock = false;
      const match = file.body.content.match(
        /\{\%\s+schema\s+\%\}([\s\S]*?)\{\%\s+endschema\s+\%\}/m
      );
      
      if (match) {
        try {
          const schema = JSON.parse(match[1]);
          if (schema && schema.blocks) {
            acceptsAppBlock = schema.blocks.some((b: any) => b.type === "@app");
          }
        } catch (e) {
          // Invalid JSON in schema
        }
      }
      
      return {
        filename: file.filename,
        acceptsAppBlock,
      };
    });

    // Map back to templates
    const mainSections = templateMainSections.map((template: any) => {
      const sectionSupport = sectionsWithAppBlock.find(
        (s: any) => s.filename === template.section
      );
      return {
        template: template.template,
        section: template.section,
        supportsAppBlocks: sectionSupport ? sectionSupport.acceptsAppBlock : false,
      };
    });

    const supportedTemplates = mainSections
      .filter((s: any) => s.supportsAppBlocks)
      .map((s: any) => s.template);

    const supportsAppBlocks = mainSections.length > 0 && 
      mainSections.every((s: any) => s.supportsAppBlocks);

    return {
      supportsAppBlocks,
      themeId,
      themeName,
      supportedTemplates,
      mainSections,
    };
  } catch (error) {
    console.error("Error checking theme compatibility:", error);
    
    // If it's a permission error, assume compatibility
    if (error instanceof Error && 
        (error.message.includes('read_themes') || 
         error.message.includes('Access denied for themes'))) {
      console.warn('Theme compatibility check skipped: read_themes scope not available');
      return {
        supportsAppBlocks: true, // Assume compatibility since we can't check
        themeId: 'unknown',
        themeName: 'Unknown Theme',
        supportedTemplates: APP_BLOCK_TEMPLATES,
        mainSections: [],
      };
    }
    
    // For other errors, return false
    return {
      supportsAppBlocks: false,
      themeId: "",
      themeName: "",
      supportedTemplates: [],
      mainSections: [],
    };
  }
}
