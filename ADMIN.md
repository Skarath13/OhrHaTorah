# OhrHaTorah Admin System Documentation

This document describes the inline visual editing system for the OhrHaTorah website.

## Overview

The admin system provides Wix-style inline editing capabilities, allowing authorized users to edit content directly on the live website without a separate admin dashboard.

## Authentication

### Login
- **URL**: `/admin/login`
- **Method**: 6-digit PIN authentication
- **Default Admin PIN**: `123456` (change in production)

### Session Management
- Sessions last 7 days
- Two cookies are used:
  - `oht_session` (HttpOnly) - Secure session token for server-side auth
  - `oht_logged_in` (non-HttpOnly) - Indicator cookie for JavaScript to detect login state

### Logout
- Click the Logout button in the edit toolbar
- Or call `POST /api/auth/logout`

## Edit Mode

### Entering Edit Mode
1. Log in at `/admin/login`
2. A small circular edit button appears in the bottom-right corner
3. Click the button to enter edit mode

### Edit Mode Features
- **Bottom Toolbar**: Shows edit status, unsaved changes count, and action buttons
- **Visual Indicators**: Editable elements show dashed outlines on hover
- **Tooltips**: "Click to edit" appears when hovering over editable content

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save all changes |
| `Enter` | Confirm edit (single-line elements) |
| `Ctrl/Cmd + Enter` | Confirm edit (multi-line elements) |
| `Escape` | Cancel current edit |

## Editable Content Types

### Text Content (`data-editable`)
Add `data-editable="unique-key"` to any text element to make it editable.

```html
<h1 data-editable="homepage-title">Welcome to OhrHaTorah</h1>
<p data-editable="about-description" data-multiline="true">
  Multi-line content here...
</p>
```

- Single-line elements: Press Enter to confirm
- Multi-line elements: Press Ctrl+Enter to confirm (add `data-multiline="true"`)

### Image Content (`data-editable-image`)
Add `data-editable-image="unique-key"` to images.

```html
<img src="/images/photo.jpg" data-editable-image="hero-image" alt="Hero" />
```

- Click to open image upload dialog
- Supports: JPEG, PNG, GIF, WebP, AVIF, SVG
- Images are uploaded to Cloudflare R2

### Brit Chadashah Override (`data-brit-editable`)
Special editable type for the weekly Brit Chadashah reading.

```html
<div data-brit-editable="true">Loading...</div>
```

Features:
- Overrides the automatic reading from the 119 Ministries schedule
- Shows "Custom" badge when override is active
- Reset button to restore automatic value

## API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login with PIN |
| `/api/auth/logout` | POST | End session |

### Content Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/content` | GET | Get all content |
| `/api/content` | POST | Create/update content |
| `/api/content/[key]` | GET | Get specific content |
| `/api/content/[key]` | PUT | Update specific content |
| `/api/content/[key]` | DELETE | Delete content |

### Image Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/images/upload` | POST | Upload image (multipart/form-data) |

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  role TEXT DEFAULT 'editor' CHECK(role IN ('admin', 'editor')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Content Table
```sql
CREATE TABLE content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);
```

## File Structure

```
src/
├── components/
│   └── admin/
│       └── InlineEditor.astro    # Main inline editor component
├── layouts/
│   └── BaseLayout.astro          # Includes InlineEditor
├── lib/
│   ├── auth.ts                   # Authentication utilities
│   └── db.ts                     # Database utilities
└── pages/
    ├── admin/
    │   ├── index.astro           # Redirect handler
    │   └── login.astro           # Login page
    └── api/
        ├── auth/
        │   ├── login.ts
        │   └── logout.ts
        ├── content/
        │   ├── index.ts
        │   └── [key].ts
        └── images/
            └── upload.ts
```

## Adding New Editable Content

### Step 1: Add the attribute
```html
<span data-editable="my-new-content">Default text</span>
```

### Step 2: (Optional) Load saved content
If you want the content to persist across page loads, fetch it from the API:

```typescript
// In your component script
const response = await fetch('/api/content/my-new-content');
const data = await response.json();
if (data.success && data.data?.value) {
  // Use saved value
}
```

## Cloudflare Infrastructure

- **D1 Database**: `ohrhatorah-db` - Stores users, sessions, and content
- **R2 Bucket**: `ohrhatorah-images` - Stores uploaded images
- **Pages**: Auto-deploys from GitHub on push to master

## Security Notes

1. **PIN Security**: PINs are hashed with bcrypt (10 rounds)
2. **Session Tokens**: 64-character hex strings from crypto.getRandomValues
3. **HttpOnly Cookies**: Session cookie is HttpOnly to prevent XSS access
4. **CSRF**: SameSite=Strict prevents cross-site request forgery
5. **Authorization**: All content/image APIs require valid session

## Troubleshooting

### Edit button not appearing
- Check if logged in (look for `oht_logged_in` cookie)
- Clear cookies and log in again
- Check browser console for JavaScript errors

### Changes not saving
- Check network tab for API errors
- Verify D1 database binding is configured
- Check Cloudflare dashboard for function errors

### Images not uploading
- Verify R2 bucket binding is configured
- Check file size (max varies by plan)
- Ensure file type is supported

## Local Development

```bash
# Start dev server
npm run dev

# Server runs at http://localhost:3005
# Note: D1/R2 bindings won't work locally without wrangler dev
```

For full functionality locally, use:
```bash
npx wrangler pages dev dist --d1=DB=ohrhatorah-db --r2=IMAGES=ohrhatorah-images
```
