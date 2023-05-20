import type { Socket } from 'socket.io-client';
import type { Metadata } from '../types/metadata';

export async function pushMetadata(metadata: Metadata, socket: Socket) {
  //@ts-ignore
  const secret = await window.ipc.invoke('getSettingsVal', 'secret');
  socket.emit('metadata', secret, metadata);
}
