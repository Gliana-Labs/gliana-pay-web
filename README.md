# GlianaPay Web

SvelteKit frontend for GlianaPay - a Web3 tipping platform for streamers.

## Features

- Streamer profile pages with tipping functionality
- Phantom wallet integration for direct payments
- QR code payments for mobile wallets
- Real-time tip alerts via OBS overlay
- Devnet support for testing

## Setup

```bash
npm install
npm run dev
```

## OBS Overlay

To add tip alerts to your stream:

1. Go to your streamer page: `glianapay.com/{your-slug}`
2. Click "OBS Overlay" link to open the overlay page
3. In OBS:
   - Add a "Browser" source
   - Enter the overlay URL
   - Set width: 600, height: 400
   - Check "Shutdown source when not visible" to save resources

The overlay shows real-time tip notifications with animations and sound.

## Tech Stack

- SvelteKit
- Tailwind CSS
- Phantom Wallet
- Solana Web3.js

## Environment

- Worker URL: `https://glianapay.com`
