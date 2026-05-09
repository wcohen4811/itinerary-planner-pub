-- Add SKU to pricing templates
ALTER TABLE "PricingLineItemTemplate" ADD COLUMN "sku" TEXT;

WITH base AS (
  SELECT
    id,
    "createdAt",
    UPPER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) AS base
  FROM "PricingLineItemTemplate"
),
ranked AS (
  SELECT
    id,
    CASE WHEN base IS NULL OR base = '' THEN 'ITEM' ELSE base END AS base,
    ROW_NUMBER() OVER (
      PARTITION BY CASE WHEN base IS NULL OR base = '' THEN 'ITEM' ELSE base END
      ORDER BY "createdAt", id
    ) AS rn
  FROM base
)
UPDATE "PricingLineItemTemplate" t
SET sku = CASE
  WHEN ranked.rn = 1 THEN ranked.base
  ELSE ranked.base || '-' || ranked.rn
END
FROM ranked
WHERE t.id = ranked.id;

ALTER TABLE "PricingLineItemTemplate" ALTER COLUMN "sku" SET NOT NULL;

CREATE UNIQUE INDEX "PricingLineItemTemplate_sku_key" ON "PricingLineItemTemplate"("sku");


