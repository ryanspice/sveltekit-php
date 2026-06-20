import { config as loadEnv } from 'dotenv';
import { assertDeployEnv } from './utils/config.mjs';

loadEnv({ quiet: true });

assertDeployEnv('Deploy precheck');

console.log('Deploy environment precheck passed.');
