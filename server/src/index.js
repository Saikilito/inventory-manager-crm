//Sistema basado en Express
import express from 'express';

//Archivos para la configuracion de modulos
import config from './config';
import db from './config/db-connection';
import server from './config/apollo';

//Settings
const app = express();
server.applyMiddleware({ app });

//DB y Server
db(
    app.listen( config.PORT , () => console.log(`🚀 Server ready at http://localhost:${config.PORT}${server.graphqlPath}`))
)
