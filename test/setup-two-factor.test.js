import request from 'supertest';
import { assert } from 'chai';
import 'dotenv/config';

describe('setup-two-factor', () => {
  const TWO_FACTOR_SETUP_URL = `https://api.syncano.io/v2/instances/${process.env.INSTANCE_NAME}/` +
    'endpoints/sockets/two-factor-auth/setup-two-factor';
  const requestUrl = request(TWO_FACTOR_SETUP_URL);

  const REGISTER_URL = `https://api.syncano.io/v2/instances/${process.env.INSTANCE_NAME}/` +
    'endpoints/sockets/rest-auth/register';
  const registerUrl = request(REGISTER_URL);

  const LOGIN_URL = `https://api.syncano.io/v2/instances/${process.env.INSTANCE_NAME}/` +
    'endpoints/sockets/rest-auth/login';
  const loginUrl = request(LOGIN_URL);

  const firstUserEmail = process.env.TEST_USER_EMAIL1;
  const secondUserEmail = process.env.TEST_USER_EMAIL2;
  const userPassword = process.env.TEST_USER_PASSWORD;

  let firstUserToken = '';

  before((done) => {
    loginUrl.post('/')
      .send({username: firstUserEmail, password: userPassword})
      .then((res) => {
        if (res.status === 400) {
          return registerUrl.post('/')
            .send({username: firstUserEmail, password: userPassword});
        }
        firstUserToken = res.body.token;
        return { status: true };
      })
      .then((res) => {
        if (res.status === 200) {
          firstUserToken = res.body.token;
        }
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  before((done) => {
    loginUrl.post('/')
      .send({username: secondUserEmail, password: userPassword})
      .then((res) => {
        if (res.status === 400) {
          return registerUrl.post('/')
            .send({username: secondUserEmail, password: userPassword});
        }
        return { status: true };
      })
      .then(() => {
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('should setup two-factor authentication for  user account if user credentials are valid',
    (done) => {
      const args = { username: firstUserEmail, token: firstUserToken };
      requestUrl.post('/')
        .send(args)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          process.env.TEST_TEMP_SECRET = res.body.tempSecret;
          assert.propertyVal(res.body, 'message', 'Two-factor setup successful, verify OTP');
          assert.property(res.body, 'otpURL');
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
