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
      const twoFactorDetails = JSON.parse(user.two_factor_details);
      const verified = speakeasy.totp.verify({
        secret: twoFactorDetails.secret,
        encoding: 'base32',
        token: two_factor_token
      });
      if (verified) {
        const userToUpdate = await users.where('username', username);
        await userToUpdate.update({ two_factor_enabled: false, two_factor_details: '' });
        return response.json({ message: 'Two-factor authentication disabled' });
      }
      return response.json({ message: 'Invalid two-factor token' }, 401);
    }
    return response.json(
      { message: 'Two-factor authentication is not enabled on user account' }, 400
    );
  } catch (err) {
    if (err.name && err.name === 'NotFoundError') {
      return response.json({ message: 'Given credentials does not match any user account' }, 401);
    }
    return response.json({ message: 'Failed to disable two-factor authentication' }, 400);
  }
};
