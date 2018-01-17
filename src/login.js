import Syncano from 'syncano-server';
import speakeasy from 'speakeasy';
import axios from 'axios';

import validateRequired from './utils/helpers';

export default async (ctx) => {
  const { response } = Syncano(ctx);
  const { username, password, two_factor_token } = ctx.args;
  const AUTH_URL = `https://api.syncano.io/v2/instances/${ctx.meta.instance}/users/auth/`;

  try {
    validateRequired({ username, password });
    const user = await axios.post(AUTH_URL, { username, password },
      {
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': ctx.meta.token }
      });
    if (!user.data.two_factor_enabled) {
      return response.json({ token: user.data.user_key, username: user.data.username });
    }
    validateRequired({ two_factor_token }, 'Please enter two-factor token', 206);

    const twoFactorDetails = JSON.parse(user.data.two_factor_details);
    const verified = speakeasy.totp.verify({
      secret: twoFactorDetails.secret,
      encoding: 'base32',
      token: two_factor_token
    });
    if (verified) {
      return response.json({ token: user.data.user_key, username: user.data.username });
    }
    return response.json({ message: 'Invalid two-factor token' }, 401);
  } catch (err) {
    if (err.customMessage) {
      const { customMessage, details, statusCode } = err;
      return response.json({ message: customMessage, details }, statusCode);
    }
    return response.json({ message: 'Given credentials does not match any user account' }, 401);
  }
};
