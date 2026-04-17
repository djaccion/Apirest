const mongoose = require('mongoose');

/*
 * VARIABLES DE ENTORNO REQUERIDAS:
 * - MONGODB_URI: URI de conexión a MongoDB Atlas.
 *   Debe estar definida en el archivo .env local (desarrollo)
 *   o en Heroku Config Vars (producción).
 *   Ejemplo: MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
 */

const connectDatabase = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error('[DATABASE] MONGODB_URI no está definida. Por favor, configura la variable de entorno MONGODB_URI en tu archivo .env o en Heroku Config Vars.');
    }

    mongoose.set('strict', true);
    mongoose.set('strictQuery', true);

    mongoose.connection.on('connected', () => {
        console.log(`[DATABASE] MongoDB Atlas conectado al host: ${mongoose.connection.host}`);
    });

    mongoose.connection.on('error', (err) => {
        console.error(`[DATABASE] Error en la conexión a MongoDB: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('[DATABASE] MongoDB se desconectó.');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('[DATABASE] MongoDB se reconectó exitosamente.');
    });

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 2,
        });
    } catch (err) {
        console.error(`[DATABASE] Fallo al conectar con MongoDB: ${err.message}`);
        throw err;
    }
};

const disconnectDatabase = async () => {
    await mongoose.connection.close();
    console.log('[DATABASE] Conexión a MongoDB cerrada correctamente.');
};

module.exports = { connectDatabase, disconnectDatabase };