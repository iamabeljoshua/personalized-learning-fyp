import 'dotenv/config';
import { DataSource } from 'typeorm';
import { loadEnvironmentVariables } from '../configuration';
import { DatabaseSourceOptions } from './config';

export const DatabaseSource = new DataSource(
  DatabaseSourceOptions(loadEnvironmentVariables().database),
);
