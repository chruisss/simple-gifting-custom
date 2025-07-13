import type { ShopConfiguration } from "@prisma/client";
import db from "../db.server";

export async function getShopConfiguration(shop: string) {
  let config = await db.shopConfiguration.findUnique({
    where: { shop },
  });

  if (!config) {
    config = await db.shopConfiguration.create({
      data: {
        shop,
        popupTitle: "Add a personalized message",
        popupAddButtonText: "Add Card",
        popupCancelButtonText: "Cancel",
        appIsEnabled: true,
        defaultCharLimit: 150,
        autoTagging: true,
        debugMode: false,
        cacheStrategy: "browser",
        apiTimeout: 30,
        // Styling defaults
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
      },
    });
  }

  return config;
}

export async function updateShopConfiguration(shop: string, data: Partial<ShopConfiguration>) {
  return await db.shopConfiguration.update({
    where: { shop },
    data,
  });
}