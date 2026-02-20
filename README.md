# GlianaPay Web

Frontend application for GlianaPay - a Web3 tipping platform for streamers built on Solana.

## Features

- **Streamer Pages** - Custom tipping pages for each streamer
- **Multi-wallet Support** - Phantom, Solflare, Backpack, Ledger
- **QR Code Payments** - Easy mobile payments via QR scan
- **Real-time Alerts** - Instant notifications on OBS overlay
- **Dashboard** - Streamer stats, settings, and management
- **Devnet Mode** - Test with fake SOL before going live

## Getting Started

```bash
# Install dependencies
npm install

# Development server (localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file in the root:

```env
PUBLIC_WORKER_URL=https://api.glianapay.com
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage - search streamer pages |
| `/login` | Streamer login/registration |
| `/dashboard` | Streamer dashboard |
| `/[slug]` | Streamer tipping page |
| `/overlay/[slug]` | OBS overlay for real-time alerts |

## OBS Overlay Setup

To add tip alerts to your stream:

1. Go to your streamer page: `https://glianapay.com/{your-slug}`
2. Click "OBS Overlay" link to open the overlay
3. In OBS Studio:
   - Add a "Browser" source
   - Enter the overlay URL
   - Recommended: Width 600, Height 400
   - Check "Shutdown source when not visible" to save resources

The overlay shows real-time tip notifications with animations and sound alerts.

## Wallet Integration

Supports multiple Solana wallets:
- Phantom
- Solflare
- Backpack
- Ledger

## Tech Stack

- **Framework**: SvelteKit 2 / Svelte 5
- **Styling**: Tailwind CSS 3
- **Blockchain**: @solana/web3.js
- **QR Codes**: qrcode npm package
- **Deployment**: Cloudflare Pages

## Deployment

```bash
# Build and deploy to Cloudflare Pages
npm run deploy
```

## Related Projects

- [gliana-pay-worker](https://github.com/Gliana-Labs/gliana-pay/tree/main/gliana-pay-worker) - Backend API

## License

MIT
