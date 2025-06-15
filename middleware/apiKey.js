const crypto = require("crypto");
const db = require("../db");
const CryptoJS = require('crypto-js');
const JWT_SECRET = process.env.JWT_SECRET || 'd1e622507595486ee06db24b1debf11064edd2ba';

// Function to generate an API key
const generateApiKey = () => {
    // Generate 32 random bytes and convert them to a hexadecimal string
    return crypto.randomBytes(32).toString("hex");
  };
  
  // Generate an API key
  const apiKey = generateApiKey();
  console.log(`Generated API Key: ${apiKey}`);

const authenticateApiKey = async (req, res, next) => {
    const apiKey = req.header("x-api-key");
    if (!apiKey) {
      return res
        .status(403)
        .json({ message: "Access denied, no API key provided" });
    }
    const api_user_details =
      "SELECT account_id,email,account_name,website,app_secret_token, r_status_code FROM accounts WHERE app_secret_token = ? AND status = 'Y'";
  
    let api_key_data = await db.get(api_user_details, [apiKey]);
    if (api_key_data.length === 0) {
        return res.status(401).json({ code: 401, message: "Invalid API key" });
    }
    if(api_key_data.length > 0 && api_key_data?.[0]?.status != 'Y'){
      return res.json({ 
        code: 401, 
        success: false, 
        message: "Account Deactivated" 
      });
    }
    req.body.user_info = {
      account_id: api_key_data[0].account_id,
      email: api_key_data[0].email,
      account_name: api_key_data[0].account_name,
      website: api_key_data[0].website,
    }; // Add user info to request
        next();
  };

  /**
 * Function for Encrypting the data
 * @param {*} data (data to encrypt)
 * @param {*} return (encrypted data)
 */
function encryptData(data) {
  var response = CryptoJS.AES.encrypt(data, JWT_SECRET);
  return response.toString();
}
/**
 * Function for decrypting the data
 * @param {*} data (data to decrypt)
 * @param {*} return (decrypt data)
 */
function decryptData(data) {
  var decrypted = CryptoJS.AES.decrypt(data, JWT_SECRET);
  if (decrypted) {
    var userinfo = decrypted.toString(CryptoJS.enc.Utf8);
    return userinfo;
  } else {
    return { userinfo: { error: 'Please send proper token' } };
  }
}
/**
 * Function for encryting the userId with session
 * @param {*} data (data to encrypt)
 * @param {*} return (encrypted data)
 */
async function tokenEncrypt(data) {
  console.log(JWT_SECRET);
  var token = jwt.sign({ data }, JWT_SECRET, {
    expiresIn: '24h',
  });
  return token;
}
/**
 * Function for decryting the userId with session
 * @param {*} data (data to decrypt)
 * @param {*} return (decrypted data)
 */
function tokenDecrypt(data) {
  try {
    data = data.replace(/^"(.*)"$/, '$1');
    const decode = jwt.verify(data, JWT_SECRET);
    return decode;
  } catch (err) {
    return { error: 'Please send proper token' };
  }
}

  module.exports = {
    authenticateApiKey,
    generateApiKey,
    encryptData,
    decryptData,
    tokenEncrypt,
    tokenDecrypt
  };