(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    process.env[key] = value;
  }
} catch (e) {
}

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import agentsRouter from './routes/agents.js';
import statsRouter from './routes/stats.js';
import negotiationsRouter from './routes/negotiations.js';
import tasksRouter from './routes/tasks.js';
import { setIO } from './socket/handler.js';
import { engine } from './simulation/engine.js';
import { validateAndRepairAgents } from './startup.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(agentsRouter);
app.use(statsRouter);
app.use(negotiationsRouter);
app.use(tasksRouter);

setIO(io);

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
  });
});

const PORT = parseInt(process.env.PORT || '4000', 10);

httpServer.listen(PORT, async () => {
  await validateAndRepairAgents();
  engine.start();
});

export { app, io };
