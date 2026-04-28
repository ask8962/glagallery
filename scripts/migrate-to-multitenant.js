const admin = require('firebase-admin');
const path = require('path');

// Using the exact Firebase Key you provided
try {
  const serviceAccount = require('../gallery-live-gla-firebase-adminsdk-fbsvc-f42bc57089.json');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (e) {
  console.error("FATAL: Could not load serviceAccountKey.json. Please generate one from Firebase Console > Project Settings > Service Accounts and save it to the root project directory.");
  process.exit(1);
}

const db = admin.firestore();

// We create a master organization to house the existing data.
const GLA_ORG_ID = 'org_gla_university_001';

async function verifyOrCreateOrg() {
  const orgRef = db.collection('organizations').doc(GLA_ORG_ID);
  const doc = await orgRef.get();

  if (!doc.exists) {
    console.log("Creating default organization: CampusHub...");
    await orgRef.set({
      id: GLA_ORG_ID,
      name: "CampusHub",
      domain: "gla.ac.in",
      branding: {
        logoUrl: "/logo.png",
        primaryColor: "#0052cc"
      },
      features: ["events", "hackathons", "clubs", "ticketing", "rewards"],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log("Organization created.");
  } else {
    console.log("✅ Organization document exists.");
  }
}

/**
 * Migrates a specific collection by injecting `organizationId`.
 */
async function migrateCollection(collectionName) {
  console.log(`\n⏳ Starting migration for collection: [${collectionName}]...`);

  const snapshot = await db.collection(collectionName).get();
  const total = snapshot.size;
  console.log(`Found ${total} total documents.`);

  let migratedCount = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Only migrate if the field is missing
    if (!data.organizationId) {
      batch.update(doc.ref, { organizationId: GLA_ORG_ID });
      migratedCount++;
      batchCount++;

      // Firestore batches can handle max 500 writes
      if (batchCount === 450) {
        await batch.commit();
        console.log(`  Committed batch of 450 items...`);
        batch = db.batch(); // Start a fresh batch
        batchCount = 0;
      }
    }
  }

  // Commit any remaining uncommitted writes in the final batch
  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`✅ Finished ${collectionName}. Migrated ${migratedCount} new documents. (${total - migratedCount} skipped)`);
}

async function runMigration() {
  console.log("🚀 Starting Zero-Downtime Multi-Tenant Migration...");
  console.log("---------------------------------------------------");

  try {
    await verifyOrCreateOrg();

    await migrateCollection('users');
    await migrateCollection('events');
    await migrateCollection('clubs');
    await migrateCollection('hackathons');
    await migrateCollection('tickets');
    await migrateCollection('transactions');
    await migrateCollection('points');
    await migrateCollection('rewards');

    console.log("\n🎉 MULTI-TENANT MIGRATION COMPLETE! 🎉");
    console.log("IMPORTANT: You must now update all frontend queries to include: .where('organizationId', '==', orgId)");

  } catch (error) {
    console.error("\n❌ MIGRATION FAILED:", error);
  }
}

// Execute Script
runMigration();
