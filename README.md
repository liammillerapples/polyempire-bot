# 🚀 PolyEmpire - Polymarket Telegram Trading Bot

A powerful, decentralized Telegram bot for trading on Polymarket with NO API KEYS required.

## Features

✅ **Wallet Management**
- Auto-generate wallets
- Import/export private keys & mnemonics
- Multi-user support

✅ **Trading**
- Search markets
- View trending markets
- Interactive BUY/SELL menus
- Real-time balance checking

✅ **Security**
- AES-256 encrypted private key storage
- No API keys exposed
- Signature-based authentication

✅ **Deployment Ready**
- Runs on Railway, Heroku, or any Node.js server
- Automatic region selection (bypasses geoblocking)
- Always online 24/7

## Installation

### Local Development

```bash
# Clone or download the repo
cd polyempire-bot

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your secrets to .env
TELEGRAM_BOT_TOKEN=your_token
ENCRYPTION_KEY=your_32_char_key
ALCHEMY_API_KEY=your_api_key
POLYGON_RPC_URL=your_rpc_url

# Run bot
npm start
```

## Deployment on Railway

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Click "Start Project"
3. Sign up with GitHub

### Step 2: Prepare GitHub Repo
1. Create a GitHub account (if you don't have one)
2. Create a new repository called `polyempire-bot`
3. Clone it locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/polyempire-bot.git
   cd polyempire-bot
   ```

### Step 3: Add All Files
Copy these files to your repo:
- `index.js`
- `bot.js`
- `firebase.js`
- `walletManager.js`
- `tradingEngine.js`
- `package.json`
- `.gitignore`
- `railway.json`
- `Procfile`
- `.env.example`
- `README.md`

### Step 4: Create `.gitignore`
```
.env
.env.local
node_modules/
data/
users.json
.DS_Store
.vscode/
```

### Step 5: Push to GitHub
```bash
git add .
git commit -m "PolyEmpire Bot - Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/polyempire-bot.git
git push -u origin main
```

### Step 6: Deploy on Railway
1. Go to https://railway.app/dashboard
2. Click "Create New Project"
3. Select "Deploy from GitHub"
4. Choose your `polyempire-bot` repository
5. Click "Deploy"

### Step 7: Add Environment Variables on Railway
1. Click your project in Railway dashboard
2. Go to "Variables" tab
3. Add these environment variables:
   ```
   TELEGRAM_BOT_TOKEN=8851704433:AAHPUfoP7c2YTUdRgsAr2f0cM7pmZBlwHYQ
   ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ALCHEMY_API_KEY=JxH1lpi70YX4FbVoXgi_w
   POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/JxH1lpi70YX4FbVoXgi_w
   ```
4. Save and Railway will auto-deploy

### Step 8: Test
Send `/start` to your bot on Telegram. It should respond! 🎉

## Usage

- **`/start`** - Create account / view wallet
- **💰 Balance** - Check USDC balance
- **🔥 Trending** - View trending markets
- **🔍 Search** - Search for markets
- **👛 Wallet** - Manage wallet (view, import, export)
- **🏆 Positions** - View open positions

## Trading

1. Go to **Trending** or **Search** markets
2. Tap a market
3. Click **💚 BUY** or **❤️ SELL**
4. Send: `AMOUNT PRICE` (e.g., `1 0.50`)
5. Trade executes!

## API Keys Required

- **Telegram Bot Token** - Get from @BotFather
- **Alchemy API Key** - Free at alchemy.com
- **Encryption Key** - Any random 32-character string

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` file to GitHub
- Use `.gitignore` to protect secrets
- Private keys are encrypted with AES-256
- No keys are logged or exposed

## Support

If bot fails to execute trades:
1. Check Railway logs for errors
2. Verify all environment variables are set
3. Make sure you have USDC deposited
4. Check Polymarket status page

## License

MIT

---

**Made with 🔥 for traders**
