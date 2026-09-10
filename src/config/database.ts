import { Sequelize } from 'sequelize';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

export const sequelize = new Sequelize(
  config.db.database,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    logging: config.isDev ? (msg) => logger.debug(msg) : false,
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: false,
    },
  }
);

export async function connectDB(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info(`MySQL database connected successfully to ${config.db.host}:${config.db.port}/${config.db.database}`);

    // Import models to ensure they are registered with Sequelize instance
    await import('../modules/user/user.model.js');
    await import('../modules/friends/friends.model.js');
    await import('../modules/reward/reward.model.js');
    await import('../modules/support/support.model.js');
    await import('../modules/notification/notification.model.js');
    await import('../modules/lobby/lobby.model.js');
    await import('../modules/match/match.model.js');
    await import('../modules/chat/chat.model.js');

    // Models are imported and registered with Sequelize instance.
    // To sync tables manually, run: npm run db:sync
  } catch (error) {
    logger.error('MySQL connection error:', error);
    if (config.isProd) {
      process.exit(1);
    }
  }
}
