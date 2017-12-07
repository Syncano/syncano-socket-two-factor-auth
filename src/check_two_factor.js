import Syncano from 'syncano-server';

import validateRequired from './utils/helpers';

export default async (ctx) => {
  const {response, users} = Syncano(ctx);
  const { username, token, two_factor_token } = ctx.args;

  const checkRequired = validateRequired({ username, token });
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
        {
          message: 'Two-factor authentication is enabled on user account',
          is_two_factor: true
        }, 200
      );
    }
    return response.json(
      {
        message: 'Two-factor authentication is not enabled on user account',
        is_two_factor: false
      }, 400
    );
  } catch (err) {
    if (err.name || err.stack) {
      return response.json(
        { message: 'Two-factor verification failed', errors: err },
        400
      );
    }
    return response.json({ message: 'Given credentials does not match any user account' }, 401);
  }
};
