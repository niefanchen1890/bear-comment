-- A project must have one page record for each widget page id. Older Cusdis
-- releases performed a read followed by a create, so concurrent first comments
-- could create duplicate page rows. Merge any existing duplicates before the
-- database starts enforcing the invariant.
CREATE TEMPORARY TABLE "_cusdis_page_merge" AS
SELECT "id" AS "duplicateId", "canonicalId"
FROM (
    SELECT
        "id",
        FIRST_VALUE("id") OVER (
            PARTITION BY "projectId", "slug"
            ORDER BY "created_at", "id"
        ) AS "canonicalId",
        ROW_NUMBER() OVER (
            PARTITION BY "projectId", "slug"
            ORDER BY "created_at", "id"
        ) AS "pageNumber"
    FROM "pages"
) AS "rankedPages"
WHERE "pageNumber" > 1;

UPDATE "comments" AS "comment"
SET "pageId" = "merge"."canonicalId"
FROM "_cusdis_page_merge" AS "merge"
WHERE "comment"."pageId" = "merge"."duplicateId";

DELETE FROM "pages" AS "page"
USING "_cusdis_page_merge" AS "merge"
WHERE "page"."id" = "merge"."duplicateId";

DROP TABLE "_cusdis_page_merge";

CREATE UNIQUE INDEX "pages_projectId_slug_key" ON "pages"("projectId", "slug");
