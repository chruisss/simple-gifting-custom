import type { ShopConfiguration } from "@prisma/client";
import db from "../db.server";

export async function getShopConfiguration(shop: string) {
  try {
    let config = await db.shopConfiguration.findUnique({
      where: { shop },
      select: {
        id: true,
        shop: true,
        appIsEnabled: true,
        autoTagging: true,
        debugMode: true,
        cacheStrategy: true,
        apiTimeout: true,
        customCss: true,
        installationCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!config) {
      config = await db.shopConfiguration.create({
        data: {
          shop,
          appIsEnabled: true,
          autoTagging: true,
          debugMode: false,
          cacheStrategy: "browser",
          apiTimeout: 30,
          installationCompleted: false,
        },
        select: {
          id: true,
          shop: true,
          appIsEnabled: true,
          autoTagging: true,
          debugMode: true,
          cacheStrategy: true,
          apiTimeout: true,
          customCss: true,
          installationCompleted: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    return config;
  } catch (error) {
    console.error("Error fetching shop configuration:", error);
    
    // If there's an issue with the existing record, try to reset it
    try {
      console.log("Attempting to reset shop configuration for:", shop);
      await db.shopConfiguration.deleteMany({
        where: { shop },
      });
      
      const newConfig = await db.shopConfiguration.create({
        data: {
          shop,
          appIsEnabled: true,
          autoTagging: true,
          debugMode: false,
          cacheStrategy: "browser",
          apiTimeout: 30,
          installationCompleted: false,
        },
        select: {
          id: true,
          shop: true,
          appIsEnabled: true,
          autoTagging: true,
          debugMode: true,
          cacheStrategy: true,
          apiTimeout: true,
          customCss: true,
          installationCompleted: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      
      return newConfig;
    } catch (resetError) {
      console.error("Failed to reset shop configuration:", resetError);
      throw new Error("Failed to get shop configuration");
    }
  }
}

export async function updateShopConfiguration(shop: string, data: Partial<ShopConfiguration>) {
  try {
    return await db.shopConfiguration.update({
      where: { shop },
      data,
      select: {
        id: true,
        shop: true,
        appIsEnabled: true,
        autoTagging: true,
        debugMode: true,
        cacheStrategy: true,
        apiTimeout: true,
        customCss: true,
        installationCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    console.error("Error updating shop configuration:", error);
    throw new Error("Failed to update shop configuration");
  }
}