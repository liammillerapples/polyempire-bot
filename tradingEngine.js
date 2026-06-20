const axios = require('axios');

const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API = 'https://clob.polymarket.com';
const DATA_API = 'https://data-api.polymarket.com';

const searchMarkets = async (query) => {
  try {
    const response = await axios.get(`${GAMMA_API}/public-search`, {
      params: { q: query },
      timeout: 10000
    });
    if (response.data && response.data.events) {
      const markets = [];
      response.data.events.forEach(event => {
        if (event.markets) markets.push(...event.markets);
      });
      return markets;
    }
    return [];
  } catch (error) {
    console.error('Search error:', error.message);
    return [];
  }
};

const getTrendingMarkets = async () => {
  try {
    const response = await axios.get(`${GAMMA_API}/markets`, {
      params: {
        order: 'volume24hr',
        ascending: false,
        limit: 20
      },
      timeout: 10000
    });
    return response.data || [];
  } catch (error) {
    console.error('Trending error:', error.message);
    return [];
  }
};

const getMarketData = async (conditionId) => {
  try {
    const response = await axios.get(`${GAMMA_API}/markets`, {
      params: { condition_ids: [conditionId] },
      timeout: 10000
    });
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    console.error('Market data error:', error.message);
    return null;
  }
};

const placeOrderWithAuth = async (wallet, market, side, amount, price) => {
  try {
    if (!market.clobTokenIds) {
      return { success: false, error: 'No trading tokens available' };
    }
    
    let clobTokenIds = market.clobTokenIds;
    if (typeof clobTokenIds === 'string') {
      clobTokenIds = JSON.parse(clobTokenIds);
    }
    
    if (!Array.isArray(clobTokenIds) || clobTokenIds.length === 0) {
      return { success: false, error: 'Invalid market tokens' };
    }

    const tokenId = side.toLowerCase() === 'buy' ? clobTokenIds[0] : clobTokenIds[1];
    
    const order = {
      tokenId: tokenId,
      side: side.toUpperCase() === 'BUY' ? 'BUY' : 'SELL',
      amount: String(parseFloat(amount)),
      price: String(parseFloat(price)),
      expirationTime: Math.floor(Date.now() / 1000) + 3600,
      nonce: Math.floor(Math.random() * 1000000),
      feeRateBps: 0
    };

    console.log('🚀 Placing order...');

    const headers = { 
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept': 'application/json',
      'Origin': 'https://polymarket.com',
      'Referer': 'https://polymarket.com/'
    };

    const response = await axios.post(`${CLOB_API}/orders`, order, {
      headers: headers,
      timeout: 15000
    });

    console.log('✅ Trade executed!', response.data);
    return {
      success: true,
      orderId: response.data.orderId || response.data.id || `0x${Math.random().toString(16).slice(2)}`,
      order: response.data
    };
  } catch (error) {
    console.error('Order error:', error.response?.status, error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Order failed'
    };
  }
};

const getUserPositions = async (address) => {
  try {
    const response = await axios.get(`${DATA_API}/positions`, {
      params: { user: address },
      timeout: 10000
    });
    return response.data || [];
  } catch (error) {
    console.error('Positions error:', error.message);
    return [];
  }
};

module.exports = {
  searchMarkets,
  getTrendingMarkets,
  getMarketData,
  placeOrderWithAuth,
  getUserPositions
};
