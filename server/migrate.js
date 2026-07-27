const sequelize = require('./config/db');
const { confirmDestructiveReset } = require('./utils/destructiveGuard');

async function migrate(){
    try{
        await confirmDestructiveReset('db:reset-dev (migrate.js)');
        console.log('Starting migration');
        await sequelize.sync({ force: true});
        console.log('Migration complete');
        process.exit(0);

    } catch (e) {
        console.error('Migration failed', e);
        process.exit(1);
    }
}

migrate();