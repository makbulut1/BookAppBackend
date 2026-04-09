import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class JamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_session')
  handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; userId?: string },
  ) {
    const { sessionId, userId } = payload;
    client.join(sessionId);
    console.log(`Client ${client.id} joined session: ${sessionId}`);
  }

  @SubscribeMessage('send_reaction')
  handleSendReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { sessionId: string; userId: string; emoji: string },
  ) {
    const { sessionId, userId, emoji } = payload;
    // Broadcast to the room (excluding the sender)
    client.to(sessionId).emit('send_reaction', { userId, emoji });
  }

  @SubscribeMessage('sync_page')
  handleSyncPage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { sessionId: string; userId: string; pageNumber: number | string },
  ) {
    const { sessionId, userId, pageNumber } = payload;
    client.to(sessionId).emit('sync_page', { userId, pageNumber });
  }

  @SubscribeMessage('add_shared_highlight')
  handleAddSharedHighlight(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { sessionId: string; userId: string; coordinates: any },
  ) {
    const { sessionId, userId, coordinates } = payload;
    client.to(sessionId).emit('add_shared_highlight', { userId, coordinates });
  }
}
