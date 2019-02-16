import * as mongoose from 'mongoose';
(<any>mongoose).Promise = Promise;
const Schema = mongoose.Schema;
import * as bcrypt from 'bcrypt';

const AuthSchema = new Schema ({
  userId: {type: String, required: true},
  passwordHash: {type: String, required: true},
  saltRounds: Number, // stored in case we increase the salt rounds in the future
});

AuthSchema.index({userId: 1});

AuthSchema.methods.createPasswordHash = function(password) {
  // https://hackernoon.com/your-node-js-authentication-tutorial-is-wrong-f1a3bf831a46
  // https://codahale.com/how-to-safely-store-a-password/
  // https://security.stackexchange.com/questions/4781/do-any-security-experts-recommend-bcrypt-for-password-storage/6415#6415

  this.saltRounds = 12;
  this.passwordHash = bcrypt.hashSync(password, this.saltRounds);
};

AuthSchema.methods.checkPassword = function(password) {
  return bcrypt.compareSync(password, this.passwordHash);
};

module.exports = mongoose.model('Auth', AuthSchema);
