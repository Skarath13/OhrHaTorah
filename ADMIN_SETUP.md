# OhrHaTorah Admin System Setup Guide

This guide walks you through setting up the new secure admin system with Cloudflare D1 database and R2 image storage.

## Prerequisites

- Node.js 18+ installed
- Cloudflare account (free tier works)
- Wrangler CLI (`npm install -g wrangler`)

## Setup Steps

### 1. Login to Cloudflare

```bash
npx wrangler login
```

### 2. Create the D1 Database

```bash
npx wrangler d1 create ohrhatorah-db
```

Copy the `database_id` from the output and update `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "ohrhatorah-db",
    "database_id": "YOUR_DATABASE_ID_HERE"  // <-- Replace this
  }
]
```

### 3. Create the R2 Bucket

```bash
npx wrangler r2 bucket create ohrhatorah-images
```

### 4. Run Database Migrations

**For local development:**
```bash
npm run db:migrate:local
```

**For production:**
```bash
npm run db:migrate
```

### 5. Create Your Admin User

Generate the hashed PIN and seed SQL:

```bash
npx tsx scripts/seed-admin.ts
```

This will output a SQL command. Run it:

**For local development:**
```bash
npx wrangler d1 execute ohrhatorah-db --local --command="INSERT INTO users (name, pin_hash, role) VALUES ('Rabbi Chuck', '<hash>', 'admin');"
```

**For production:**
```bash
npx wrangler d1 execute ohrhatorah-db --command="INSERT INTO users (name, pin_hash, role) VALUES ('Rabbi Chuck', '<hash>', 'admin');"
```

### 6. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3005/admin to test the login.

## Admin Features

### Dashboard (`/admin`)
- Overview of content items, pages, and images
- Recent activity feed
- Quick links to all admin sections

### Content Editor (`/admin/content`)
- Add, edit, and delete site content
- Organized by category (Rabbi Info, Services, etc.)
- Content types: text, HTML, JSON

### Image Library (`/admin/images`)
- Upload images (drag & drop supported)
- Copy image URLs for use in content
- Delete unused images
- Supports: JPEG, PNG, GIF, WEBP, AVIF, SVG

### Pages (`/admin/pages`)
- Configure page-specific content
- Edit SEO meta descriptions

## Security Features

- **6-digit PIN authentication** - Simple for non-technical users
- **bcrypt hashing** - PINs are securely hashed, never stored plain
- **Server-side sessions** - Stored in D1, 7-day expiry
- **HTTP-only cookies** - Sessions can't be accessed by JavaScript
- **Protected routes** - Middleware checks auth on all `/admin/*` routes

## Customization

### Adding New Admin Users

Use the seed script or run SQL directly:

```sql
-- First, generate a bcrypt hash for the PIN
-- Then insert the user:
INSERT INTO users (name, pin_hash, role) VALUES ('User Name', '<bcrypt_hash>', 'editor');
```

Roles:
- `admin` - Full access including user management
- `editor` - Content editing only

### Changing a User's PIN

```sql
UPDATE users SET pin_hash = '<new_bcrypt_hash>' WHERE name = 'User Name';
```

## Deployment to Cloudflare

1. Ensure `wrangler.jsonc` has the correct database_id
2. Run migrations on production database
3. Deploy:

```bash
npx wrangler pages deploy dist
```

Or use Cloudflare Pages with Git integration for automatic deployments.

## Troubleshooting

### "Database not available" error
- Make sure D1 bindings are configured in `wrangler.jsonc`
- For local dev, ensure you've run `npm run db:migrate:local`

### Login not working
- Verify the user exists in the database
- Check that the PIN hash was generated correctly
- Look at browser console and server logs for errors

### Images not uploading
- Verify R2 bucket exists and is configured in `wrangler.jsonc`
- Check file size (max 10MB) and type restrictions

## Architecture

```
/admin/login     → PIN login page
/admin           → Dashboard
/admin/content   → Content editor
/admin/images    → Image library
/admin/pages     → Page management

/api/auth/*      → Authentication endpoints
/api/content/*   → Content CRUD
/api/images/*    → Image upload/delete
```

## Support

For issues or questions, contact the development team or open an issue in the repository.
