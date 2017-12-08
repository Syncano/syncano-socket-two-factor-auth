import Syncano from 'syncano-server';
import speakeasy from 'speakeasy';

import validateRequired from './utils/helpers';

export default async (ctx) => {
  const {response, users} = Syncano(ctx);
  const { username, token, two_factor_token } = ctx.args;

  const checkRequired = validateRequired({ username, token, two_factor_token });
  if (checkRequired.passes === false) {
    return response.json(
      { message: 'Validation error(s)', details: checkRequired.validateMessages }, 400
    );
  }

  try {
    const user = await users.where('username', username).firstOrFail();
    if (user.user_key !== token) {
      return response.json(
        { message: 'Given credentials does not match any user account' }, 401
      );
    }
    if (user.two_factor_enabled === true) {
      return response.json(
        { message: 'Two-factor authentication already enabled' }, 400
      );
    }
    const twoFactorDetails = JSON.parse(user.two_factor_details);
    const verified = speakeasy.totp.verify({
      secret: twoFactorDetails.tempSecret,
      encoding: 'base32',
      token: two_factor_token
    });
    if (verified) {
      twoFactorDetails.secret = twoFactorDetails.tempSecret;
      const twoFactorDetailsStringify = JSON.stringify(twoFactorDetails);
      const userToUpdate = await users.where('username', username);
      await userToUpdate.update(
        { two_factor_enabled: true, two_factor_details: twoFactorDetailsStringify }
      );
      return response.json({ message: 'Two-factor authentication enabled' });
    }
    return response.json({ message: 'Invalid two-factor token, verification failed' }, 400);
  } catch (err) {
    if (err.name && err.name === 'NotFoundError') {
      return response.json({ message: 'Given credentials does not match any user account' }, 401);
    }
    return response.json({ message: 'Verification of two-factor token failed' }, 400);
  }
};
