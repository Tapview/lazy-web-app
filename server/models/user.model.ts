import * as mongoose from 'mongoose';
(<any>mongoose).Promise = Promise;
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    givenName: {type: String},
    familyName: {type: String},
    email: {type: String},
    emailConfirmed: {type: Boolean, default: false},
    timeRegistered: {type: Date, default: Date.now},
    isAdmin: {type: Boolean, default: false},
    profileImage: {type: String},
  }
);

UserSchema.index({displayUsername: 1});
UserSchema.index({email: 1});


/**
 * removes secret data we don't want to send to the front-end
 * @return {*}
 */
UserSchema.methods.frontendData = function() {
  return {
    id: this._id,
    givenName: this.givenName,
    familyName: this.familyName,
    email: this.email,
    emailConfirmed: this.emailConfirmed,
    timeRegistered: this.timeRegistered,
    isAdmin: this.isAdmin,
    profileImage: this.profileImage,
  };
};

module.exports = mongoose.model('User', UserSchema);
