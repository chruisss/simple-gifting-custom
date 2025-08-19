/*
  Warnings:

  - You are about to drop the column `accentColor` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `autoOpenPopup` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `backgroundColor` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `blurBackground` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `buttonBorderRadius` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `buttonSize` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `buttonStyle` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `customFontUrl` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `defaultCharLimit` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `fontFamily` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `fontSize` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `fontWeight` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `modalAnimation` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `popupAddButtonText` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `popupCancelButtonText` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `popupTitle` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `primaryColor` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `secondaryColor` on the `ShopConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `textColor` on the `ShopConfiguration` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ShopConfiguration" DROP COLUMN "accentColor",
DROP COLUMN "autoOpenPopup",
DROP COLUMN "backgroundColor",
DROP COLUMN "blurBackground",
DROP COLUMN "buttonBorderRadius",
DROP COLUMN "buttonSize",
DROP COLUMN "buttonStyle",
DROP COLUMN "customFontUrl",
DROP COLUMN "defaultCharLimit",
DROP COLUMN "fontFamily",
DROP COLUMN "fontSize",
DROP COLUMN "fontWeight",
DROP COLUMN "modalAnimation",
DROP COLUMN "popupAddButtonText",
DROP COLUMN "popupCancelButtonText",
DROP COLUMN "popupTitle",
DROP COLUMN "primaryColor",
DROP COLUMN "secondaryColor",
DROP COLUMN "textColor";
