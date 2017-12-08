import Syncano from 'syncano-server';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

import validateRequired from './utils/helpers';

export default async (ctx) => {
  const {response, users} = Syncano(ctx);
  const { username, token } = ctx.args;

  const checkRequired = validateRequired({ username, token });
  if (checkRequired.passes === false) {
    return response.json(
      { message: 'Validation error(s)', details: checkRequired.validateMessages }, 400
    );
  }

  const createTwoFactorDetails = () => {
    return new Promise((resolve, reject) => {
      const secret = speakeasy.generateSecret({length: 20});
      QRCode.toDataURL(secret.otpauth_url, (err, url) => {
        if (err) {
          reject({
            message: 'Failed to setup two-factor authentication on user account',
            statusCode: 400
          });
        }
        const twoFactorDetails = {
          tempSecret: secret.base32,
          otpURL: secret.otpauth_url,
          dataURL: url
        };
        resolve(twoFactorDetails);
      });
    });
  };

  try {
    const user = await users.where('username', username).firstOrFail();
    if (user.user_key !== token) {
      return response.json(
        { message: 'Given credentials does not match any user account' }, 401
      );
    }
    if (user.two_factor_enabled === true) {
      return response.json({ message: 'Two-factor authentication already enabled.' }, 400);
    }
    const twoFactorDetails = await createTwoFactorDetails();
    const { tempSecret } = twoFactorDetails;
    const twoFactorDetailsStringify = JSON.stringify({ tempSecret, secret: '' });
    const userToUpdate = await users.where('username', username);
    await userToUpdate.update(
      { two_factor_enabled: false, two_factor_details: twoFactorDetailsStringify }
    );
    return response.json({ message: 'Verify OTP', ...twoFactorDetails});
  } catch (err) {
    if (err.name && err.name === 'NotFoundError') {
      return response.json({ message: 'Given credentials does not match any user account' }, 401);
    }
    return response.json(
      { message: 'Failed to setup two-factor authentication on user account' },
      400
    );
  }
};
