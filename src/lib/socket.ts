import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents } from '../types';

type TypedSocket = Socket<ServerToClientEvents>;

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io({
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: Infinity,
      randomizationFactor: 0,
    });
  }
  return socket;
}
