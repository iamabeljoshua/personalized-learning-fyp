import 'dotenv/config';
import { plainToClass, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
  validateSync,
} from 'class-validator';
import { ConfigService, registerAs } from '@nestjs/config';

const APP_CONFIG_KEY = 'app';

export class DatabaseConfig {
  @IsString()
  @IsNotEmpty()
  host: string;

  @IsNumber()
  port: number;

  @IsString()
  @IsNotEmpty()
  user: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class RedisConfig {
  @IsString()
  @IsNotEmpty()
  host: string;

  @IsNumber()
  port: number;
}

export class AiServiceConfig {
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class JwtConfig {
  @IsString()
  @IsNotEmpty()
  privateKey: string;

  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @IsString()
  @IsNotEmpty()
  expiration: string;
}

export class AppConfiguration {
  @IsNumber()
  port: number;

  @IsString()
  @IsNotEmpty()
  frontendUrl: string;

  @IsString()
  mediaStoragePath: string;

  @ValidateNested()
  @Type(() => DatabaseConfig)
  database: DatabaseConfig;

  @ValidateNested()
  @Type(() => RedisConfig)
  redis: RedisConfig;

  @ValidateNested()
  @Type(() => AiServiceConfig)
  aiService: AiServiceConfig;

  @ValidateNested()
  @Type(() => JwtConfig)
  jwt: JwtConfig;

  public static fromService(configService: ConfigService) {
    const config = configService.get<AppConfiguration>(APP_CONFIG_KEY);
    if (!config) throw new Error('Invalid configuration');
    return config;
  }
}

const env = (key: string): string => process.env[key] ?? '';

export const loadEnvironmentVariables = (): AppConfiguration => ({
  port: Number(env('PORT')),
  frontendUrl: env('FRONTEND_URL'),
  mediaStoragePath: env('MEDIA_STORAGE_PATH'),
  database: {
    host: env('DB_HOST'),
    port: Number(env('DB_PORT')),
    user: env('DB_USER'),
    password: env('DB_PASSWORD'),
    name: env('DB_NAME'),
  },
  redis: {
    host: env('REDIS_HOST'),
    port: Number(env('REDIS_PORT')),
  },
  aiService: {
    url: env('AI_SERVICE_URL'),
  },
  jwt: {
    privateKey: env('JWT_PRIVATE_KEY'),
    publicKey: env('JWT_PUBLIC_KEY'),
    expiration: env('JWT_EXPIRATION'),
  },
});

function getValidatedConfigurations(config: AppConfiguration) {
  const configVariables = plainToClass(AppConfiguration, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(configVariables, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return configVariables;
}

export const AppConfigurationRegister = registerAs(
  APP_CONFIG_KEY,
  (): AppConfiguration => {
    return getValidatedConfigurations(loadEnvironmentVariables());
  },
);
