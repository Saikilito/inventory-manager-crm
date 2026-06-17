import express from 'express';
import cors from 'cors';
import { expressMiddleware } from '@as-integrations/express4';
import server, { context } from './config/apollo.js';
import config from './config/index.js';

const app = express();
app.use(express.json());
app.use(cors());

await server.start();
app.use('/graphql', cors(), express.json(), expressMiddleware(server, { context }));

const { default: db } = await import('./config/db-connection.js');

app.listen(config.PORT, () => {
  db();
  console.log(`🚀 Server ready at http://localhost:${config.PORT}/graphql`);
});
