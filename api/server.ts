import app from './app.js';
import { WebSocketServer } from './ws/WebSocketServer.js';
import { CallService } from './services/CallService.js';
import { PatrolService } from './services/PatrolService.js';

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

WebSocketServer.init(server);

setInterval(() => {
  CallService.checkTimeouts();
}, 10 * 1000);

setInterval(() => {
  PatrolService.checkDue();
}, 30 * 1000);

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
