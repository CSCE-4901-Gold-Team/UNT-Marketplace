import { prisma } from "@/lib/prisma";
import { imageAdapter } from "@/lib/image-adapter";

async function main() {
  console.log("Finding base64 images in database...");

  const images = await prisma.image.findMany({
    where: {
      url: {
        startsWith: "data:",
      },
    },
    select: {
      id: true,
      url: true,
      listingId: true,
    },
  });

  console.log(`Found ${images.length} base64 image(s) to migrate.`);

  if (images.length === 0) {
    console.log("Nothing to migrate. Exiting.");
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const img of images) {
    try {
      console.log(`Migrating image #${img.id} for listing ${img.listingId}...`);

      const newPath = await imageAdapter.saveFromBase64(img.url, { type: "listing" });

      await prisma.image.update({
        where: { id: img.id },
        data: { url: newPath },
      });

      successCount++;
      console.log(`  -> Saved to ${newPath}`);
    } catch (error) {
      failCount++;
      console.error(`  -> FAILED: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`\nMigration complete: ${successCount} succeeded, ${failCount} failed.`);
}

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
