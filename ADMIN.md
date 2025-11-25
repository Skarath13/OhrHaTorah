# OhrHaTorah Admin System

Wix-style inline editing for authorized users.

## Quick Start

1. Login at `/admin/login` with 6-digit PIN
2. Click floating edit button (bottom-right)
3. Click editable elements to modify
4. Save changes with toolbar or Ctrl+S

## Admin PIN Setup

PIN is stored as bcrypt hash in D1 database (never hardcoded).

```bash
# Generate admin user SQL
ADMIN_PIN=<your-6-digit-pin> npx ts-node scripts/seed-admin.ts

# Run generated SQL on production
npx wrangler d1 execute ohrhatorah-db --remote --command="<generated SQL>"
```

## Editable Elements

| Attribute | Usage |
|-----------|-------|
| `data-editable="key"` | Text content |
| `data-editable-image="key"` | Images (uploads to R2) |
| `data-multiline="true"` | Multi-line text |
| `data-brit-editable="true"` | Brit Chadashah override |

## Keyboard Shortcuts

- `Ctrl+S` - Save all
- `Enter` - Confirm edit
- `Ctrl+Enter` - Confirm multi-line
- `Escape` - Cancel

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Login (PIN) |
| `/api/auth/logout` | POST | Logout |
| `/api/content` | GET/POST | List/create content |
| `/api/content/[key]` | GET/PUT/DELETE | Manage content |
| `/api/images/upload` | POST | Upload image |
| `/api/images/list` | GET | List images |

## Security

- Bcrypt hashed PINs (10 rounds)
- Rate limiting: 5 attempts → 15 min lockout
- CSRF protection on all mutations
- HttpOnly session cookies
- Revision history for audit

## Cloudflare Setup

**Required compatibility flags** (Pages > Settings > Functions):
- `nodejs_compat`
- `disable_nodejs_process_v2`

**Bindings**:
- `DB` → D1 database `ohrhatorah-db`
- `IMAGES` → R2 bucket `ohrhatorah-images`

## Troubleshooting

- **Edit button missing**: Clear cookies, re-login
- **[object Object] errors**: Add `disable_nodejs_process_v2` flag, redeploy
- **CSRF errors**: Refresh page
- **Images not uploading**: Check R2 binding
