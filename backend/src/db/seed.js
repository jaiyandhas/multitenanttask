require('dotenv').config();

async function main() {
  const { seedAll } = require('./seedData');
  await seedAll();
  console.log('Seed complete.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

