import { Module } from '@nestjs/common';
import { JamGateway } from './jam.gateway';

@Module({
  providers: [JamGateway],
})
export class JamModule {}
