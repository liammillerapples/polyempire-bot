const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = './data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text) => {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

const getUsers = () => {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Read error:', error);
    return {};
  }
};

const saveUsers = (users) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Save error:', error);
  }
};

const saveUser = (telegramId, wallet, extraData = {}) => {
  try {
    const users = getUsers();
    users[telegramId] = {
      walletAddress: wallet.address,
      encryptedPrivateKey: encrypt(wallet.privateKey),
      mnemonic: wallet.mnemonic,
      balance: '0.00',
      trades: [],
      createdAt: new Date().toISOString(),
      username: extraData.username || `user_${telegramId}`,
      ...extraData
    };
    saveUsers(users);
    return true;
  } catch (error) {
    console.error('Save user error:', error);
    return false;
  }
};

const getUser = (telegramId) => {
  try {
    const users = getUsers();
    return users[telegramId] || null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

const updateUserBalance = (telegramId, balance) => {
  try {
    const users = getUsers();
    if (users[telegramId]) {
      users[telegramId].balance = balance;
      saveUsers(users);
    }
  } catch (error) {
    console.error('Update balance error:', error);
  }
};

const addTrade = (telegramId, trade) => {
  try {
    const users = getUsers();
    if (users[telegramId]) {
      if (!users[telegramId].trades) users[telegramId].trades = [];
      users[telegramId].trades.push(trade);
      saveUsers(users);
    }
  } catch (error) {
    console.error('Add trade error:', error);
  }
};

const updateWallet = (telegramId, newWallet) => {
  try {
    const users = getUsers();
    if (users[telegramId]) {
      users[telegramId].walletAddress = newWallet.address;
      users[telegramId].encryptedPrivateKey = encrypt(newWallet.privateKey);
      users[telegramId].mnemonic = newWallet.mnemonic;
      saveUsers(users);
    }
  } catch (error) {
    console.error('Update wallet error:', error);
  }
};

const decryptPrivateKey = (encrypted) => {
  try {
    return decrypt(encrypted);
  } catch (error) {
    console.error('Decrypt error:', error);
    return null;
  }
};

module.exports = {
  saveUser,
  getUser,
  updateUserBalance,
  addTrade,
  updateWallet,
  decryptPrivateKey
};
