import { config as loadEnv } from 'dotenv';
import { assertDeployEnv } from './utils/config.mjs';

loadEnv();

assertDeployEnv('Deploy precheck');

console.log('Deploy environment precheck passed.');
