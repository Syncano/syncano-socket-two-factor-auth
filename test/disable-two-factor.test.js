import request from 'supertest';
import speakeasy from 'speakeasy';
import { assert } from 'chai';
import 'dotenv/config';

describe('disable-two-factor', () => {
  const {
    INSTANCE_NAME, FIRST_USER_EMAIL, SECOND_USER_EMAIL, TEST_USER_PASSWORD
  } = process.env;

  const DISABLE_TWO_FACTOR_URL = `https://api.syncano.io/v2/instances/${INSTANCE_NAME}/` +
    'endpoints/sockets/two-factor-auth/disable-two-factor';
  const requestUrl = request(DISABLE_TWO_FACTOR_URL);

  const LOGIN_URL = `https://api.syncano.io/v2/instances/${INSTANCE_NAME}/` +
    'endpoints/sockets/rest-auth/login';
  const loginUrl = request(LOGIN_URL);

  let FIRST_USER_TOKEN, SECOND_USER_TOKEN = '';

  before((done) => {
    loginUrl.post('/')
      .send({ username: FIRST_USER_EMAIL, password: TEST_USER_PASSWORD })
      .then((res) => {
        if (res.status === 200) {
          FIRST_USER_TOKEN = res.body.token;
        }
        return loginUrl.post('/')
          .send({ username: SECOND_USER_EMAIL, password: TEST_USER_PASSWORD });
      })
      .then((res) => {
        if (res.status === 200) {
          SECOND_USER_TOKEN = res.body.token;
        }
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('should return status "400" if wrong two factor token supplied',
    (done) => {
      const argsWrongTwoFactorToken = {
        username: FIRST_USER_EMAIL, token: FIRST_USER_TOKEN, two_factor_token: '112233'
      };
      requestUrl.post('/')
        .send(argsWrongTwoFactorToken)
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          assert.propertyVal(res.body,
            'message', 'Invalid two-factor token');
          done();
        });
    });

  it('should fail if trying to disable two-factor auth on user account where ' +
    'two-factor authentication not enabled',
  (done) => {
    const args = {
      username: SECOND_USER_EMAIL, token: SECOND_USER_TOKEN, two_factor_token: '112233'
    };
    requestUrl.post('/')
      .send(args)
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        assert.propertyVal(res.body,
          'message', 'Two-factor authentication is not enabled on user account');
        done();
      });
  });

  it('should disable two-factor auth if two-factor enabled on user account and parameters valid',
    (done) => {
      const twoFactorToken = speakeasy.totp({
        secret: process.env.TEST_TEMP_SECRET,
        encoding: 'base32'
      });
      const argsValidTwoFactorToken = {
        username: FIRST_USER_EMAIL, token: FIRST_USER_TOKEN, two_factor_token: twoFactorToken
      };
      requestUrl.post('/')
        .send(argsValidTwoFactorToken)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          assert.propertyVal(res.body, 'message', 'Two-factor authentication disabled');
          done();
        });
    });

  it('should return message "Validation error(s)" if username, two_factor_token or user token' +
    'parameter empty',
  (done) => {
    const argsEmptyParams = { username: '', two_factor_token: '112233' };
    requestUrl.post('/')
      .send(argsEmptyParams)
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        assert.propertyVal(res.body,
          'message', 'Validation error(s)');
        done();
      });
  });

  it('should return status "401" if wrong token for user supplied',
    (done) => {
      const argsUserWrongToken = {
        username: FIRST_USER_EMAIL, token: 'wrongToken', two_factor_token: '112233'
      };
      requestUrl.post('/')
        .send(argsUserWrongToken)
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          assert.propertyVal(res.body,
            'message', 'Given credentials does not match any user account');
          done();
        });
    });

  it('should return status "401" if username does not exist',
    (done) => {
      const argsNonExistingEmail = {
        username: 'nonExistingEmail@user.com', token: 'userToken', two_factor_token: '112233'
      };
      requestUrl.post('/')
        .send(argsNonExistingEmail)
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          assert.propertyVal(res.body,
            'message', 'Given credentials does not match any user account');
          done();
        });
    });
});
