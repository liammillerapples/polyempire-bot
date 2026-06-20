const { Telegraf, Markup } = require('telegraf');
const { ethers } = require('ethers');
const { saveUser, getUser, updateUserBalance, addTrade, updateWallet, decryptPrivateKey } = require('./firebase');
const { 
  generateWallet, 
  importWalletFromPrivateKey, 
  importWalletFromMnemonic,
  getBalance, 
  isValidPrivateKey,
  isValidMnemonic
} = require('./walletManager');
const { 
  searchMarkets, 
  getTrendingMarkets,
  getMarketData,
  placeOrderWithAuth,
  getUserPositions
} = require('./tradingEngine');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const userSessions = {};

const mainMenu = () => Markup.inlineKeyboard([
  [Markup.button.callback('👛 Wallet', 'wallet'), Markup.button.callback('💰 Balance', 'balance')],
  [Markup.button.callback('🔥 Trending', 'trending'), Markup.button.callback('🔍 Search', 'search')],
  [Markup.button.callback('🏆 Positions', 'portfolio'), Markup.button.callback('📋 Guide', 'guide')],
  [Markup.button.callback('❓ Help', 'help')],
]);

const backButton = () => Markup.inlineKeyboard([
  [Markup.button.callback('« Back to Menu', 'menu')]
]);

const walletMenu = () => Markup.inlineKeyboard([
  [Markup.button.callback('📋 View Wallet', 'view_wallet')],
  [Markup.button.callback('🔑 Export Private Key', 'export_pk')],
  [Markup.button.callback('📝 Export Mnemonic', 'export_mnemonic')],
  [Markup.button.callback('⬇️ Import Private Key', 'import_pk')],
  [Markup.button.callback('⬇️ Import Mnemonic', 'import_mnemonic')],
  [Markup.button.callback('🔄 Create New Wallet', 'new_wallet')],
  [Markup.button.callback('« Back', 'menu')]
]);

const tradeMenu = (index, source) => Markup.inlineKeyboard([
  [Markup.button.callback('💚 BUY', `buy_${index}_${source}`), Markup.button.callback('❤️ SELL', `sell_${index}_${source}`)],
  [Markup.button.callback('📋 Copy ID', `copy_${index}_${source}`)],
  [Markup.button.callback('« Back', source === 'trending' ? 'trending' : 'menu')]
]);

bot.command('start', async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    const telegramName = ctx.from.first_name || 'Trader';
    const existingUser = await getUser(telegramId);
    
    if (existingUser) {
      const balance = await getBalance(existingUser.walletAddress);
      await updateUserBalance(telegramId, balance);
      
      await ctx.reply(
        `⚡ *PolyEmpire Trading Bot*\n\n` +
        `Welcome back, ${telegramName}!\n\n` +
        `👤 Account: *${existingUser.username || 'Anonymous'}*\n` +
        `💰 Balance: *$${balance}*\n` +
        `📍 Wallet: \`${existingUser.walletAddress.slice(0, 10)}...\`\n\n` +
        `Ready to trade?`,
        { parse_mode: 'Markdown', ...mainMenu() }
      );
    } else {
      await ctx.reply('🔄 *Creating your PolyEmpire account...*', { parse_mode: 'Markdown' });
      
      try {
        const wallet = generateWallet();
        const userData = {
          username: `trader_${telegramId.toString().slice(-6)}`,
          telegramName: telegramName
        };
        
        await saveUser(telegramId, wallet, userData);
        
        await ctx.reply(
          `✅ *Account Created!*\n\n` +
          `👤 Account: *${userData.username}*\n` +
          `📍 Wallet: \`${wallet.address}\`\n\n` +
          `📥 *Deposit USDC to trade:*\n` +
          `\`${wallet.address}\`\n\n` +
          `Networks: Polygon • OP • Base • Ethereum • BSC • Arbitrum\n` +
          `Min: 10 USDC\n` +
          `No gas fees!\n\n` +
          `Ready to trade?`,
          { parse_mode: 'Markdown', ...mainMenu() }
        );
      } catch (createError) {
        console.error('Account creation error:', createError);
        const wallet = generateWallet();
        await saveUser(telegramId, wallet);
        await ctx.reply(`✅ *Account Created!*\n\nWallet: \`${wallet.address}\``, { parse_mode: 'Markdown', ...mainMenu() });
      }
    }
  } catch (error) {
    console.error('Start error:', error);
    ctx.reply('❌ Error. Try /start again.');
  }
});

bot.action('menu', async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    const user = await getUser(telegramId);
    if (!user) return ctx.answerCbQuery('No wallet');
    const balance = await getBalance(user.walletAddress);
    try {
      await ctx.editMessageText(
        `⚡ *PolyEmpire*\n\nBalance: *$${balance}*\nAccount: *${user.username || 'Anonymous'}*`,
        { parse_mode: 'Markdown', ...mainMenu() }
      );
    } catch (editError) {
      if (!editError.description?.includes('not modified')) throw editError;
      ctx.answerCbQuery('Menu');
    }
  } catch (error) {
    console.error('Menu error:', error);
    ctx.answerCbQuery('Error');
  }
});

bot.action('wallet', async (ctx) => {
  try {
    await ctx.editMessageText(
      `👛 *WALLET MANAGEMENT*\n\n` +
      `Choose an option:`,
      { parse_mode: 'Markdown', ...walletMenu() }
    );
    ctx.answerCbQuery();
  } catch (error) {
    console.error('Wallet error:', error);
  }
});

bot.action('view_wallet', async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    const user = await getUser(telegramId);
    if (!user) return;
    
    const mnemonic = user.mnemonic || 'N/A';
    
    await ctx.editMessageText(
      `👛 *YOUR WALLET*\n\n` +
      `Address:\n\`${user.walletAddress}\`\n\n` +
      `Mnemonic:\n\`${mnemonic}\`\n\n` +
      `⚠️ Keep your mnemonic safe!`,
      { parse_mode: 'Markdown', ...backButton() }
    );
    ctx.answerCbQuery();
  } catch (error) {
    console.error('View wallet error:', error);
  }
});

bot.action('export_pk', async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    const user = await getUser(telegramId);
    if (!user) return;
    
    const privateKey = decryptPrivateKey(user.encryptedPrivateKey);
    
    await ctx.editMessageText(
      `🔑 *YOUR PRIVATE KEY*\n\n` +
      `\`${privateKey}\`\n\n` +
      `⚠️ KEEP THIS SAFE!`,
      { parse_mode: 'Markdown', ...backButton() }
    );
    ctx.answerCbQuery();
  } catch (error) {
    console.error('Export PK error:', error);
  }
});

bot.action('export_mnemonic', async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    const user = await getUser(telegramId);
    if (!user) return;
    
    await ctx.editMessageText(
      `📝 *YOUR MNEMONIC PHRASE*\n\n` +
      `\`${user.mnemonic}\`\n\n` +
      `⚠️ KEEP THIS SAFE!`,
      { parse_mode: 'Markdown', ...backButton() }
    );
    ctx.answerCbQuery();
  } catch (error) {
    console.error('Export mnemonic error:', error);
  }
});

bot.action('import_pk', async (ctx) => {
  try {
    await ctx.editMessageText(
      `⬇️ *IMPORT PRIVATE KEY*\n\n` +
      `Send your private key:`,
      { parse_mode: 'Markdown', ...backButton() }
    );
    userSessions[ctx.from.id] = { mode: 'import_pk' };
    ctx.answerCbQuery();
  } catch (error) {
    console.error('Import PK error:', error);
  }
});

bot.action('import_mnemonic', async (ctx) => {
  try {
    await ctx.editMessageText(
      `⬇️ *IMPORT MNEMONIC*\n\n` +
      `Send your mnemonic phrase:`,
      { parse_mode: 'Markdown', ...backButton() }
    );
    userSessions[ctx.from.id] = { mode: 'import_mnemonic' };
    ctx.answerCbQuery();
  } catch (error) {
    console.error('Import mnemonic error:', error);
  }
});

bot.action('new_wallet', async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    const wallet = generateWallet();
    await updateWallet(telegramId, wallet);
    
    await ctx.editMessageText(
      `✅ *NEW WALLET CREATED!*\n\n` +
      `Address:\n\`${wallet.address}\`\n\n` +
      `Mnemonic:\n\`${wallet.mnemonic}\``,
      { parse_mode: 'Markdown', ...backButton() }
    );
    ctx.answerCbQuery();
  } catch (error) {
    console.error('New wallet error:', error);
  }
});

bot.action('balance', async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    const user = await getUser(telegramId);
    if (!user) return;
    
    await ctx.answerCbQuery('🔄 Checking...');
    const balance = await getBalance(user.walletAddress);
    await updateUserBalance(telegramId, balance);
    
    await ctx.editMessageText(
      `💰 *YOUR BALANCE*\n\n` +
      `USDC: *$${balance}*\n\n` +
      `Status: ${balance > 0 ? '✅ Ready to trade!' : '⏳ Awaiting deposit'}`,
      { parse_mode: 'Markdown', ...backButton() }
    );
  } catch (error) {
    console.error('Balance error:', error);
    ctx.answerCbQuery('Error');
  }
});

bot.action('trending', async (ctx) => {
  try {
    await ctx.answerCbQuery('🔥 Loading...');
    const markets = await getTrendingMarkets();
    if (!markets || markets.length === 0) {
      await ctx.editMessageText('No markets available', backButton());
      return;
    }
    let message = `🔥 *TRENDING*\n\n`;
    markets.slice(0, 5).forEach((m, i) => {
      const odds = m.lastTradePrice ? (m.lastTradePrice * 100).toFixed(1) : '50.0';
      const volume = (m.volumeNum || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
      message += `${i + 1}) ${m.question}\n• ${odds}¢ • Vol: $${volume}\n\n`;
    });
    userSessions[ctx.from.id] = { mode: 'trending', markets };
    const buttons = markets.slice(0, 5).map((m, i) => [
      Markup.button.callback(`${i + 1}. ${m.question.slice(0, 28)}...`, `view_${i}_trending`)
    ]);
    buttons.push([Markup.button.callback('« Back', 'menu')]);
    await ctx.editMessageText(message, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
  } catch (error) {
    console.error('Trending error:', error);
    ctx.answerCbQuery('Error');
  }
});

bot.action('search', async (ctx) => {
  try {
    await ctx.editMessageText(
      `🔍 *SEARCH MARKETS*\n\n` +
      `Enter market name:`,
      { parse_mode: 'Markdown', ...backButton() }
    );
    userSessions[ctx.from.id] = { mode: 'search' };
    ctx.answerCbQuery();
  } catch (error) {
    console.error('Search error:', error);
  }
});

bot.action('portfolio', async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    const user = await getUser(telegramId);
    if (!user) return;
    
    await ctx.answerCbQuery('📊 Loading...');
    const positions = await getUserPositions(user.walletAddress);
    
    let message = `🏆 *YOUR POSITIONS*\n\n`;
    if (!positions || positions.length === 0) {
      message += `No open positions yet.\n\nStart trading!`;
    } else {
      positions.slice(0, 5).forEach((pos, i) => {
        message += `${i + 1}. ${pos.market || 'Market'}\n   Shares: ${pos.shares || '0'}\n\n`;
      });
    }
    await ctx.editMessageText(message, { parse_mode: 'Markdown', ...backButton() });
  } catch (error) {
    console.error('Portfolio error:', error);
    ctx.answerCbQuery('Error');
  }
});

bot.action('guide', async (ctx) => {
  try {
    const message = 
      `📋 *HOW TO TRADE*\n\n` +
      `1️⃣ Fund Wallet\n2️⃣ Browse Markets\n3️⃣ Select BUY/SELL\n4️⃣ Enter Amount & Price\n5️⃣ Execute!`;
    await ctx.editMessageText(message, { parse_mode: 'Markdown', ...backButton() });
    ctx.answerCbQuery();
  } catch (error) {
    console.error('Guide error:', error);
  }
});

bot.action('help', async (ctx) => {
  try {
    const message = 
      `❓ *HELP*\n\n` +
      `/start - Account\n` +
      `/search - Search\n` +
      `/positions - Positions`;
    await ctx.editMessageText(message, { parse_mode: 'Markdown', ...backButton() });
    ctx.answerCbQuery();
  } catch (error) {
    console.error('Help error:', error);
  }
});

bot.action(/^view_(\d+)_(.+)$/, async (ctx) => {
  try {
    const index = parseInt(ctx.match[1]);
    const source = ctx.match[2];
    const session = userSessions[ctx.from.id];
    if (!session || !session.markets) return ctx.answerCbQuery('Session expired');
    const market = session.markets[index];
    const conditionId = market.conditionId || 'N/A';
    const odds = market.lastTradePrice ? (market.lastTradePrice * 100).toFixed(1) : '50.0';
    const volume = (market.volumeNum || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
    const message = `📊 *${market.question}*\n\nOdds: ${odds}¢ • Vol: $${volume}\n\nWhat would you like to do?`;
    await ctx.editMessageText(message, { parse_mode: 'Markdown', ...tradeMenu(index, source) });
    ctx.answerCbQuery('Ready!');
  } catch (error) {
    console.error('View error:', error);
  }
});

bot.action(/^buy_(\d+)_(.+)$/, async (ctx) => {
  try {
    const index = parseInt(ctx.match[1]);
    const source = ctx.match[2];
    const session = userSessions[ctx.from.id];
    if (!session || !session.markets) return ctx.answerCbQuery('Session expired');
    const market = session.markets[index];
    
    userSessions[ctx.from.id] = { ...session, tradeMode: 'buy', selectedMarket: market, marketIndex: index, tradeSource: source };
    
    await ctx.editMessageText(
      `💚 *BUY ${market.question}*\n\n` +
      `Send: AMOUNT PRICE\n\nExample: 1 0.50`,
      { parse_mode: 'Markdown', ...backButton() }
    );
    ctx.answerCbQuery();
  } catch (error) {
    console.error('Buy error:', error);
  }
});

bot.action(/^sell_(\d+)_(.+)$/, async (ctx) => {
  try {
    const index = parseInt(ctx.match[1]);
    const source = ctx.match[2];
    const session = userSessions[ctx.from.id];
    if (!session || !session.markets) return ctx.answerCbQuery('Session expired');
    const market = session.markets[index];
    
    userSessions[ctx.from.id] = { ...session, tradeMode: 'sell', selectedMarket: market, marketIndex: index, tradeSource: source };
    
    await ctx.editMessageText(
      `❤️ *SELL ${market.question}*\n\n` +
      `Send: AMOUNT PRICE\n\nExample: 1 0.50`,
      { parse_mode: 'Markdown', ...backButton() }
    );
    ctx.answerCbQuery();
  } catch (error) {
    console.error('Sell error:', error);
  }
});

bot.action(/^copy_(\d+)_(.+)$/, async (ctx) => {
  try {
    const index = parseInt(ctx.match[1]);
    const session = userSessions[ctx.from.id];
    if (!session || !session.markets) return ctx.answerCbQuery('Session expired');
    const market = session.markets[index];
    const conditionId = market.conditionId || 'N/A';
    await ctx.reply(`📋 ID:\n\n\`${conditionId}\``);
    ctx.answerCbQuery('ID sent!');
  } catch (error) {
    console.error('Copy error:', error);
  }
});

bot.on('text', async (ctx) => {
  try {
    const text = ctx.message.text;
    const telegramId = ctx.from.id;
    const session = userSessions[telegramId];
    const user = await getUser(telegramId);
    
    if (!user) return ctx.reply('👛 Use /start');
    
    if (session && session.mode === 'import_pk') {
      if (!isValidPrivateKey(text)) {
        return ctx.reply('❌ Invalid private key');
      }
      const wallet = importWalletFromPrivateKey(text);
      if (!wallet) return ctx.reply('❌ Error importing key');
      await updateWallet(telegramId, wallet);
      userSessions[telegramId] = {};
      return ctx.reply(`✅ *Wallet Imported!*\n\nAddress: \`${wallet.address}\``, { parse_mode: 'Markdown', ...mainMenu() });
    }
    
    if (session && session.mode === 'import_mnemonic') {
      if (!isValidMnemonic(text)) {
        return ctx.reply('❌ Invalid mnemonic');
      }
      const wallet = importWalletFromMnemonic(text);
      if (!wallet) return ctx.reply('❌ Error importing mnemonic');
      await updateWallet(telegramId, wallet);
      userSessions[telegramId] = {};
      return ctx.reply(`✅ *Wallet Imported!*\n\nAddress: \`${wallet.address}\``, { parse_mode: 'Markdown', ...mainMenu() });
    }
    
    if (session && (session.mode === 'search' || session.mode === 'market_search')) {
      await ctx.reply('🔄 Searching...');
      const markets = await searchMarkets(text);
      if (!markets || markets.length === 0) {
        await ctx.reply(`❌ No markets found: "${text}"`);
        return;
      }
      let message = `🔍 *Results for "${text}"*\n\n`;
      markets.slice(0, 5).forEach((m, i) => {
        const odds = m.lastTradePrice ? (m.lastTradePrice * 100).toFixed(1) : '50.0';
        const volume = (m.volumeNum || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
        message += `${i + 1}) ${m.question}\n• ${odds}¢ • Vol: $${volume}\n\n`;
      });
      const buttons = markets.slice(0, 5).map((m, i) => [
        Markup.button.callback(`${i + 1}. ${m.question.slice(0, 28)}...`, `view_${i}_search`)
      ]);
      buttons.push([Markup.button.callback('« Back', 'menu')]);
      userSessions[telegramId] = { mode: 'search_results', markets };
      await ctx.reply(message, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
      return;
    }
    
    if (session && session.tradeMode && session.selectedMarket) {
      const parts = text.split(' ');
      if (parts.length !== 2) {
        return ctx.reply(`❌ Format: AMOUNT PRICE\n\nExample: 1 0.50`);
      }
      
      const [amount, price] = parts;
      const market = session.selectedMarket;
      const side = session.tradeMode;
      
      const processingMsg = await ctx.reply(`⏳ *Executing ${side.toUpperCase()} order...*`, { parse_mode: 'Markdown' });
      try {
        const decryptedPK = decryptPrivateKey(user.encryptedPrivateKey);
        const wallet = new ethers.Wallet(decryptedPK);
        
        const result = await placeOrderWithAuth(wallet, market, side, amount, price);
        if (result.success) {
          await addTrade(telegramId, { orderId: result.orderId, market: market.question, side, amount, price, timestamp: new Date().toISOString(), status: 'executed' });
          await ctx.telegram.editMessageText(processingMsg.chat.id, processingMsg.message_id, undefined, `✅ *TRADE EXECUTED!*\n\n🎯 Side: ${side.toUpperCase()}\n📊 Amount: ${amount}\n💰 Price: $${price}\n🏛️ Market: ${market.question}`, { parse_mode: 'Markdown', ...mainMenu() });
        } else {
          await ctx.telegram.editMessageText(processingMsg.chat.id, processingMsg.message_id, undefined, `❌ *Trade Failed*\n\n${result.error}`, { parse_mode: 'Markdown', ...mainMenu() });
        }
      } catch (tradeError) {
        console.error('Trade error:', tradeError);
        await ctx.telegram.editMessageText(processingMsg.chat.id, processingMsg.message_id, undefined, `❌ Error: ${tradeError.message}`, { parse_mode: 'Markdown', ...mainMenu() });
      }
      
      userSessions[telegramId] = {};
      return;
    }
  } catch (error) {
    console.error('Text error:', error);
  }
});

bot.launch();
console.log('✅ PolyEmpire Bot Ready - Running from Railway!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;
