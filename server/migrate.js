const sequelize = require('./config/db');

async function migrate(){
    try{
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