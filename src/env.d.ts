/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { User } from './lib/auth';
import type { DonorRecordRequestQueueMessage } from './lib/givingRecordRequests';
import type { UpdateRequestQueueMessage } from './lib/updateRequests';

declare namespace App {
  interface Locals {
    runtime: {
      env: {
        DB: D1Database;
        FORM_DB: D1Database;
        IMAGES: R2Bucket;
        ASSETS: Fetcher;
        UPDATE_REQUEST_QUEUE: Queue<UpdateRequestQueueMessage | DonorRecordRequestQueueMessage>;
        TURNSTILE_SECRET_KEY: string;
        TURNSTILE_SITE_KEY: string;
      };
    };
    user?: User;
  }
}
