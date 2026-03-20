import { DataSourceOptions } from 'typeorm';
import { DatabaseConfig } from '../configuration';

export const DatabaseSourceOptions = (
  dbConfig: DatabaseConfig,
): DataSourceOptions => {
  return {
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.name,
    entities: [`${__dirname}/entities/*.{ts,js}`],
    migrationsTableName: 'orm_migrations',
    migrations: [`${__dirname}/migrations/*.{ts,js}`],
    logging: ['error'],
  };
};
