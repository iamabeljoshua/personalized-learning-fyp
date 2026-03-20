import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppConfiguration } from '../../infrastructure/configuration';
import { RepositoriesModule } from '../../infrastructure/orm/repositories/repositories.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    RepositoriesModule,
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const config = AppConfiguration.fromService(configService);
        return {
          privateKey: config.jwt.privateKey,
          publicKey: config.jwt.publicKey,
          signOptions: {
            algorithm: 'RS256' as const,
            expiresIn: config.jwt.expiration as any,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy],
})
export class AuthModule {}
