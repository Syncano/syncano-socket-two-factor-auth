import request from 'supertest';
import { assert } from 'chai';
import 'dotenv/config';

describe('check-two-factor', () => {
  const CHECK_TWO_FACTOR_URL = `https://api.syncano.io/v2/instances/${process.env.INSTANCE_NAME}/` +
    'endpoints/sockets/two-factor-auth/check-two-factor';
  const requestUrl = request(CHECK_TWO_FACTOR_URL);

  const LOGIN_URL = `https://api.syncano.io/v2/instances/${process.env.INSTANCE_NAME}/` +
    'endpoints/sockets/rest-auth/login';
  const loginUrl = request(LOGIN_URL);

  const firstUserEmail = process.env.TEST_USER_EMAIL1;
  const secondUserEmail = process.env.TEST_USER_EMAIL2;
  const userPassword = process.env.TEST_USER_PASSWORD;
  let firstUserToken, secondUserToken = '';

  before((done) => {
    loginUrl.post('/')
      .send({username: firstUserEmail, password: userPassword})
      .then((res) => {
        if (res.status === 200) {
          firstUserToken = res.body.token;
        }
        return loginUrl.post('/')
          .send({username: secondUserEmail, password: userPassword});
      })
      .then((res) => {
        if (res.status === 200) {
          secondUserToken = res.body.token;
        }
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('should return "false" for is_two_factor if two factor authentication not enabled',
    (done) => {
      const argsTwoFactorNotEnabled = { username: secondUserEmail, token: secondUserToken };
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
        username: firstUserEmail, token: firstUserToken
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
      const argsUserWrongToken = { username: firstUserEmail, token: 'wrongToken' };
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
