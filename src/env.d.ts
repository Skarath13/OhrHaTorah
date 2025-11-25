/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { User } from './lib/auth';

declare namespace App {
  interface Locals {
    runtime: {
      env: {
        DB: D1Database;
        IMAGES: R2Bucket;
      };
    };
    user?: User;
  }
}
