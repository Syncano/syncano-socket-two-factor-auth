import Syncano from 'syncano-server';

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
    const userToUpdate = await users.where('username', username);
    await userToUpdate.update({ two_factor_enabled: false, two_factor_details: '' });
    return response.json({ message: 'Two-factor authentication disabled' });
  } catch (err) {
    if (err.name || err.stack) {
      return response.json(
        { message: 'Failed to disable two-factor authentication', errors: err },
        400
      );
    }
    return response.json({ message: 'Given credentials does not match any user account' }, 401);
  }
};
