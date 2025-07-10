-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopConfiguration" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "popupTitle" TEXT NOT NULL DEFAULT 'Add a personal message',
    "popupAddButtonText" TEXT NOT NULL DEFAULT 'Add card',
    "popupCancelButtonText" TEXT NOT NULL DEFAULT 'Cancel',
    "appIsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultCharLimit" INTEGER NOT NULL DEFAULT 150,
    "autoTagging" BOOLEAN NOT NULL DEFAULT true,
    "debugMode" BOOLEAN NOT NULL DEFAULT false,
    "analyticsTracking" BOOLEAN NOT NULL DEFAULT true,
    "cacheStrategy" TEXT NOT NULL DEFAULT 'browser',
    "apiTimeout" INTEGER NOT NULL DEFAULT 30,
    "primaryColor" TEXT NOT NULL DEFAULT '#2563eb',
    "secondaryColor" TEXT NOT NULL DEFAULT '#1d4ed8',
    "accentColor" TEXT NOT NULL DEFAULT '#059669',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "textColor" TEXT NOT NULL DEFAULT '#1e293b',
    "buttonStyle" TEXT NOT NULL DEFAULT 'primary',
    "buttonSize" TEXT NOT NULL DEFAULT 'medium',
    "buttonBorderRadius" INTEGER NOT NULL DEFAULT 12,
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "fontSize" TEXT NOT NULL DEFAULT '16',
    "fontWeight" TEXT NOT NULL DEFAULT '500',
    "modalAnimation" TEXT NOT NULL DEFAULT 'fade',
    "autoOpenPopup" BOOLEAN NOT NULL DEFAULT false,
    "blurBackground" BOOLEAN NOT NULL DEFAULT true,
    "customCss" TEXT,
    "customFontUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopConfiguration_shop_key" ON "ShopConfiguration"("shop");
