import * as mongoose from 'mongoose';
(<any>mongoose).Promise = Promise;
const Schema = mongoose.Schema;
import * as bcrypt from 'bcrypt';

const UserSchema = new Schema({
    givenName: {type: String},
    familyName: {type: String},
    username: {type: String, unique: true, required: true},
    displayUsername: {type: String, required: true},
    email: {type: String},
    emailConfirmed: {type: Boolean, default: false},
    timeRegistered: {type: Date, default: Date.now},
    passwordHash: {type: String, required: true},
    saltRounds: Number, // stored in case we increase the salt rounds in the future
    isAdmin: {type: Boolean, default: false},
    profileImage: {type: String},
    organisations: [{ type: Schema.Types.ObjectId , ref: 'Organisation'}],
  }
);

UserSchema.index({username: 1});
UserSchema.index({displayUsername: 1});
UserSchema.index({email: 1});


UserSchema.methods.createPasswordHash = function(password) {
  // https://hackernoon.com/your-node-js-authentication-tutorial-is-wrong-f1a3bf831a46
  // https://codahale.com/how-to-safely-store-a-password/
  // https://security.stackexchange.com/questions/4781/do-any-security-experts-recommend-bcrypt-for-password-storage/6415#6415

  this.saltRounds = 12;
  this.passwordHash = bcrypt.hashSync(password, this.saltRounds);
};

UserSchema.methods.checkPassword = function(password) {
  return bcrypt.compareSync(password, this.passwordHash);
};

/**
 * removes secret data we don't want to send to the front-end
 * @return {*}
 */
UserSchema.methods.frontendData = function() {
  return {
    id: this._id,
    givenName: this.givenName,
    familyName: this.familyName,
    username: this.username,
    displayUsername: this.displayUsername,
    email: this.email,
    emailConfirmed: this.emailConfirmed,
    timeRegistered: this.timeRegistered,
    isAdmin: this.isAdmin,
    profileImage: this.profileImage,
  };
};

module.exports = mongoose.model('User', UserSchema);
