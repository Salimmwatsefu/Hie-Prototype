const { initializeDatabase } = require('../config/database');

async function main() {
  try {
    console.log('Initializing HIE database...');
    await initializeDatabase();
    console.log('Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

main();

