const { ethers } = require('ethers');

const USDC_CONTRACT = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
const USDC_ABI = ['function balanceOf(address account) view returns (uint256)'];

const generateWallet = () => {
  try {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic.phrase
    };
  } catch (error) {
    console.error('Wallet generation error:', error);
    return null;
  }
};

const importWalletFromPrivateKey = (privateKey) => {
  try {
    const wallet = new ethers.Wallet(privateKey);
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic ? wallet.mnemonic.phrase : 'N/A'
    };
  } catch (error) {
    console.error('Import wallet error:', error);
    return null;
  }
};

const importWalletFromMnemonic = (mnemonic) => {
  try {
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic.phrase
    };
  } catch (error) {
    console.error('Import mnemonic error:', error);
    return null;
  }
};

const getBalance = async (address) => {
  try {
    if (!address || !ethers.isAddress(address)) {
      console.error('Invalid address:', address);
      return '0.00';
    }

    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    const contract = new ethers.Contract(USDC_CONTRACT, USDC_ABI, provider);
    
    const balance = await contract.balanceOf(address);
    const formatted = ethers.formatUnits(balance, 6);
    
    return formatted;
  } catch (error) {
    console.error('Balance error:', error.message);
    return '0.00';
  }
};

const isValidAddress = (address) => {
  return ethers.isAddress(address);
};

const isValidPrivateKey = (privateKey) => {
  try {
    new ethers.Wallet(privateKey);
    return true;
  } catch (error) {
    return false;
  }
};

const isValidMnemonic = (mnemonic) => {
  try {
    ethers.Wallet.fromPhrase(mnemonic);
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  generateWallet,
  importWalletFromPrivateKey,
  importWalletFromMnemonic,
  getBalance,
  isValidAddress,
  isValidPrivateKey,
  isValidMnemonic
};
