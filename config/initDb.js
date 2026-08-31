const pool = require('./db');

async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`files\` (
        \`uuid\` varchar(36) NOT NULL,
        \`bucket\` varchar(255) NOT NULL,
        \`file_key\` varchar(255) NOT NULL,
        \`is_public\` tinyint(1) NOT NULL DEFAULT 0,
        \`owner_api_key\` text,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`uuid\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`access_logs\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`file_uuid\` varchar(36) NOT NULL,
        \`ip_address\` varchar(45),
        \`accessed_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`status\` varchar(50) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);
    
    console.log('Database tables initialized (files, access_logs).');
  } catch (error) {
    console.error('Error initializing database tables:', error);
  }
}

module.exports = initializeDatabase;
