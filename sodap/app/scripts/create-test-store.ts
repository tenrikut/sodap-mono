import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // First, create a test store owner
    const storeOwner = await prisma.user.create({
      data: {
        username: "test_store_owner",
        email: "test_owner@sodap.com",
        password: "test123", // In production, this should be hashed
        role: "store_owner",
        storeOwner: {
          create: {
            status: "approved",
          },
        },
      },
      include: {
        storeOwner: true,
      },
    });

    if (!storeOwner.storeOwner) {
      throw new Error("Failed to create store owner");
    }

    // Then create a test store
    const store = await prisma.store.create({
      data: {
        name: "Test Store",
        description: "A test store for development",
        ownerId: storeOwner.storeOwner.id,
      },
    });

    console.log("Test store created with ID:", store.id);
    console.log("Store owner created with ID:", storeOwner.id);
  } catch (error) {
    console.error("Error creating test store:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
