import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import {
  AppConfiguration,
  AppConfigurationRegister,
} from './infrastructure/configuration';
import { DatabaseSourceOptions } from './infrastructure/orm/config';
import { HealthModule } from './api/health/health.module';
import { AuthModule } from './api/auth/auth.module';
import { StudentsModule } from './api/students/students.module';
import { GoalsModule } from './api/goals/goals.module';
import { ContentModule } from './api/content/content.module';
import { QuizzesModule } from './api/quizzes/quizzes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [AppConfigurationRegister],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const configuration = AppConfiguration.fromService(configService);
        return DatabaseSourceOptions(configuration.database);
      },
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const config = AppConfiguration.fromService(configService);
        return {
          connection: {
            host: config.redis.host,
            port: config.redis.port,
          },
        };
      },
      inject: [ConfigService],
    }),
    HealthModule,
    AuthModule,
    StudentsModule,
    GoalsModule,
    ContentModule,
    QuizzesModule,
  ],
})
export class AppModule {}
