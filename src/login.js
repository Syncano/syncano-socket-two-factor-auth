import Syncano from 'syncano-server';
import speakeasy from 'speakeasy';
import axios from 'axios';

import validateRequired from './utils/helpers';

export default async (ctx) => {
  const { response } = Syncano(ctx);
  const { username, password, two_factor_token } = ctx.args;
  const AUTH_URL = `https://api.syncano.io/v2/instances/${ctx.meta.instance}/users/auth/`;

  const checkRequired = validateRequired({ username, password });
  if (checkRequired.passes === false) {
    return response.json(
      { message: 'Validation error(s)', details: checkRequired.validateMessages }, 400
    );
  }

  try {
    const user = await axios.post(AUTH_URL, {username, password},
      {
        headers: {'Content-Type': 'application/json', 'X-API-KEY': ctx.meta.token}
      });
    if (user.data.two_factor_enabled === false || user.data.two_factor_enabled === null) {
      return response.json({token: user.data.user_key, username: user.data.username});
    }
    const checkToken = validateRequired({ two_factor_token });
    if (checkToken.passes === false) {
      return response.json(
        { message: 'Please enter two-factor token' }, 401
      );
    }
    const twoFactorDetails = JSON.parse(user.data.two_factor_details);
    const verified = speakeasy.totp.verify({
      secret: twoFactorDetails.secret,
      encoding: 'base32',
      token: two_factor_token
    });
    if (verified) {
      return response.json({token: user.data.user_key, username: user.data.username});
    }
    return response.json({ message: 'Invalid two-factor token' }, 401);
  } catch (err) {
    return response.json({ message: 'Given credentials does not match any user account' }, 401);
  }
};
