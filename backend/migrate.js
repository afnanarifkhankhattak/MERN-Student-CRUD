// backend/migrate.js
// Copies users and students from `test` database → `CRUD` database.
// Run ONCE:  node migrate.js

const { MongoClient } = require('mongodb');

// Full connection string, no database name — we specify databases in code
const URI = 'mongodb+srv://afnanarifkhankhattak_db_user:Afnan123456@fastfoodgalaxy.am7smdh.mongodb.net/?retryWrites=true&w=majority';

async function migrateCollection(client, name) {
  const source = client.db('test').collection(name);
  const target = client.db('CRUD').collection(name);

  const docs = await source.find({}).toArray();
  console.log(`📦 ${name}: found ${docs.length} documents in test.${name}`);

  if (docs.length === 0) {
    console.log(`⚠️  Skipping ${name} — nothing to copy`);
    return;
  }

  await target.deleteMany({});
  console.log(`🧹 Cleared CRUD.${name}`);

  const result = await target.insertMany(docs);
  console.log(`✅ Copied ${result.insertedCount} documents into CRUD.${name}`);
}

(async () => {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    await migrateCollection(client, 'users');
    await migrateCollection(client, 'students');

    console.log('\n🎉 Migration complete.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.close();
  }
})();