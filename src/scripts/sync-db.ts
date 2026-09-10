import { sequelize } from '../config/database.js';
import { logger } from '../utils/logger.js';

async function syncDatabase() {
  const isForce = process.argv.includes('--force');
  const isAlter = process.argv.includes('--alter') || !isForce;

  try {
    logger.info('Connecting to database for synchronization...');
    await sequelize.authenticate();
    logger.info('Database connected.');

    // Import all models to ensure they are registered with Sequelize instance
    await import('../modules/user/user.model.js');
    await import('../modules/friends/friends.model.js');
    await import('../modules/reward/reward.model.js');
    await import('../modules/support/support.model.js');
    await import('../modules/notification/notification.model.js');
    await import('../modules/lobby/lobby.model.js');
    await import('../modules/match/match.model.js');
    await import('../modules/chat/chat.model.js');

    if (isForce) {
      logger.warn('⚠️  Running FORCE sync: Dropping and recreating all tables...');
      await sequelize.sync({ force: true });
      logger.info('✅ All database tables dropped and recreated successfully.');
    } else {
      logger.info('🔄 Running ALTER sync: Updating tables to match models without dropping data...');
      await sequelize.sync({ alter: true });
      logger.info('✅ All database tables synchronized successfully.');
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Failed to synchronize database:', error);
    await sequelize.close().catch(() => { });
    process.exit(1);
  }
}

syncDatabase();
