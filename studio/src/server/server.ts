import { Server, Socket } from 'socket.io';
import settings from '../electron/utils/settings';

let broadcaster: string;
let metadata: any;
let port = 3000;

export function bootstrap() {
  const io = new Server({ cors: { origin: '*' } });

  io.on('error', (error) => {
    console.log('Server: ' + error);
  });

  io.on('connection', (socket: Socket) => {
    socket.on('broadcaster', (secret: string) => {
      if (secret !== settings.get('secret')) {
        console.log('Server: Invalid broadcaster secret');
        return;
      }

      console.log('Server: Broadcaster has connected');
      broadcaster = socket.id;
      socket.broadcast.emit('broadcaster');
    });

    socket.on('port', (secret: string, newPort: number) => {
      if (secret !== settings.get('secret')) {
        console.log('Server: Invalid broadcaster secret');
        return;
      }
      console.log(port);
      port = newPort;
      io.listen(port);
    });

    socket.on('watcher', () => {
      console.log('Server: New watcher has connected');

      if (metadata) {
        socket.emit('metadata', metadata);
      }

      socket.to(broadcaster).emit('watcher', socket.id);
    });

    socket.on('disconnect', () => {
      if (socket.id === broadcaster) {
        socket.broadcast.emit('end');
        metadata = undefined;
      }

      socket.to(broadcaster).emit('disconnectPeer', socket.id);
    });

    //webRTC stuff
    socket.on('offer', ({ id, message }) => {
      socket.to(id).emit('offer', { id: socket.id, message });
    });

    socket.on('answer', ({ id, message }) => {
      socket.to(id).emit('answer', { id: socket.id, message });
    });

    socket.on('candidate', ({ id, message }) => {
      socket.to(id).emit('candidate', { id: socket.id, message });
    });

    socket.on('metadata', (secret: string, song) => {
      if (secret !== settings.get('secret')) {
        console.log('Server: Invalid broadcaster secret');
        return;
      }

      metadata = song;

      socket.broadcast.emit('metadata', song);
    });

    socket.on('question', (question) => {
      socket.to(broadcaster).emit('question', question);
    });
  });

  io.listen(port);
  console.log('Server: Started successfully');
}

bootstrap();
