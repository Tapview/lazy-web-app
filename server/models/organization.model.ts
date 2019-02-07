import * as mongoose from 'mongoose';
(<any>mongoose).Promise = Promise;
const Schema = mongoose.Schema;

const OrganizationSchema = new Schema({
  name: {type: String, required: true},
  website: {type: String},
  logo: {type: String},
  phoneNumber: {type: String},
  userCount: {type: Number},
});

OrganizationSchema.index({name: 'text'});
OrganizationSchema.methods.frontendData = function() {
  return {
    id: this._id,
    name: this.name,
    website: this.website,
    logo: this.logo,
    phoneNumber: this.phoneNumber,
    userCount: this.userCount,
  };
};

module.exports = mongoose.model('Organization', OrganizationSchema);
