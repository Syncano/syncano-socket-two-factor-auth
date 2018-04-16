import Syncano from '@syncano/core';

import validateRequired from './utils/helpers';

export default async (ctx) => {
  const { response, users } = new Syncano(ctx);
  const { username, token } = ctx.args;

  try {
    validateRequired({ username, token });
    const user = await users.where('username', username).firstOrFail();
    if (user.user_key !== token) {
      return response.json(
        { message: 'Given credentials does not match any user account' }, 401
      );
    }
    if (user.two_factor_enabled) {
      return response.json(
        {
          message: 'Two-factor authentication is enabled on user account',
          is_two_factor: true
        }
      );
    }
    return response.json(
      {
        message: 'Two-factor authentication is not enabled on user account',
        is_two_factor: false
      }
    );
  } catch (err) {
    if (err.customMessage) {
      return response.json({ message: err.customMessage, details: err.details }, 400);
    }
    if (err.name && err.name === 'NotFoundError') {
      return response.json({ message: 'Given credentials does not match any user account' }, 401);
    }
    return response.json({ message: 'Two-factor verification failed' }, 400);
  }
};
