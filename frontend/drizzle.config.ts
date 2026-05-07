import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './auth-schema.ts',   // confirmed correct from your dir command
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});