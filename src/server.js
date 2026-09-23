import { createServer } from 'node:http';
import { createRequestHandler } from './app.js';

const port = Number.parseInt(process.env.PORT || '3000', 10);
const server = createServer(createRequestHandler());

server.listen(port, '127.0.0.1', () => {
  console.log(`Integration Monitor running at http://localhost:${port}`);
});

