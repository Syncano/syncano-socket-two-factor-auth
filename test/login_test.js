import request from 'supertest';
import speakeasy from 'speakeasy';
import { assert } from 'chai';
import 'dotenv/config';


describe('login', () => {
  const LOGIN_URL = `https://api.syncano.io/v2/instances/${process.env.INSTANCE_NAME}/` +
    'endpoints/sockets/two-factor-auth/login/';
  const requestUrl = request(LOGIN_URL);

  const firstUserEmail = process.env.TEST_USER_EMAIL1;
  const secondUserEmail = process.env.TEST_USER_EMAIL2;
  const userPassword = process.env.TEST_USER_PASSWORD;

  it('should login user with two factor auth not enabled if valid user details supplied',
    (done) => {
      const args = {
        username: secondUserEmail, password: userPassword
      };
      requestUrl.post('/')
        .send(args)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          assert.property(res.body, 'token');
          assert.property(res.body, 'username');
          done();
        });
    });

  it('should login user with two-factor auth enabled if valid credentials supplied',
    (done) => {
      const twoFactorToken = speakeasy.totp({
        secret: process.env.TEST_TEMP_SECRET,
        encoding: 'base32'
      });
      const argsValidTwoFactorToken = {
        username: firstUserEmail, password: userPassword, two_factor_token: twoFactorToken
      };
      requestUrl.post('/')
        .send(argsValidTwoFactorToken)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          assert.property(res.body, 'token');
          assert.property(res.body, 'username');
          done();
        });
    });

  it('should return message "Please enter two-factor token" if two-factor auth enabled on account' +
    ' but two_factor_token not supplied',
  (done) => {
    const argsMissingRequiredParam = { username: firstUserEmail, password: userPassword };
    requestUrl.post('/')
      .send(argsMissingRequiredParam)
      .expect(401)
      .end((err, res) => {
        if (err) return done(err);
        assert.propertyVal(res.body,
          'message', 'Please enter two-factor token');
        done();
      });
  });

  it('should return message "Validation error(s)" if username, two_factor_token or user token' +
    'parameter is empty',
  (done) => {
    const argsEmptyParams = { username: '', password: '112233' };
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

  it('should return status "401" if user does not exist',
    (done) => {
      const argsNonExistingEmail = {
        username: 'nonExistingEmail@user.com', password: 'userToken'
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
