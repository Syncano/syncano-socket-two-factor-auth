import request from 'supertest';
import { assert } from 'chai';
import 'dotenv/config';

describe('check-two-factor', () => {
  const {
    INSTANCE_NAME, FIRST_USER_EMAIL, SECOND_USER_EMAIL, TEST_USER_PASSWORD
  } = process.env;

  const CHECK_TWO_FACTOR_URL = `https://api.syncano.io/v2/instances/${INSTANCE_NAME}/` +
    'endpoints/sockets/two-factor-auth/check-two-factor';
  const requestUrl = request(CHECK_TWO_FACTOR_URL);

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

  it('should return "false" for is_two_factor if two factor authentication not enabled',
    (done) => {
      const argsTwoFactorNotEnabled = { username: SECOND_USER_EMAIL, token: SECOND_USER_TOKEN };
      requestUrl.post('/')
        .send(argsTwoFactorNotEnabled)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          assert.propertyVal(res.body, 'is_two_factor', false);
          assert.property(res.body, 'message');
          done();
        });
    });

  it('should return "true" for is_two_factor if two factor authentication enabled',
    (done) => {
      const argsTwoFactorEnabled = {
        username: FIRST_USER_EMAIL, token: FIRST_USER_TOKEN
      };
      requestUrl.post('/')
        .send(argsTwoFactorEnabled)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          assert.propertyVal(res.body, 'is_two_factor', true);
          assert.property(res.body, 'message');
          done();
        });
    });

  it('should return message "Validation error(s)" if username or token parameter is empty',
    (done) => {
      const argsEmptyParams = { username: '' };
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
      const argsUserWrongToken = { username: FIRST_USER_EMAIL, token: 'wrongToken' };
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

  it('should return status "401" if username does not exist or password',
    (done) => {
      const argsNonExistingEmail = { username: 'nonExistingEmail@user.com', token: 'userToken' };
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
