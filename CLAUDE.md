# Ohr HaTorah Website - Claude Instructions

## Project Overview
Messianic Jewish community website for Ohr HaTorah in Los Angeles. Features Torah readings, candle lighting times, and community information with admin content management capabilities.

## Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript
- **APIs**: Hebcal (Torah portions, candle times), Sefaria (fallback)
- **Storage**: localStorage (temporary admin overrides)

## Key Files
- `index.html` - Main page with Torah readings and community info
- `style.css` - Complete styling system
- `js/script.js` - API integrations, admin panel, content management
- `OhrHaTorah/` - Main site directory

## Development Priorities

### Todo Items

#### High Priority
1. **Migrate Admin Override System to Cloudflare Database**
   - Current Brit Chadasha overrides use localStorage (device-only)
   - Need Cloudflare D1 or KV store for site-wide admin changes
   - Replace localStorage calls in admin panel with API endpoints
   - Implement Cloudflare Workers for serverless backend

#### Medium Priority
- Improve mobile responsiveness
- Add more Torah portion mappings
- Enhance admin authentication

## Admin System Notes
- Password: Simple hash function (insecure, needs improvement)
- Edit mode: Live content editing with overlay system
- Current limitation: Changes only visible to editor's device

## API Integrations
- **Hebcal**: Primary source for Torah portions and times
- **Sefaria**: Fallback for Torah readings
- **Sunrise-sunset.org**: Backup sunset calculations

## Known Issues
- Admin overrides not shared between users
- Simple password hashing needs security upgrade
- No persistent content management

## Development Commands
```bash
# Local development
open index.html

# No build process - static files
```