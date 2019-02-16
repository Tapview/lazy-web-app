import * as mongoose from 'mongoose';
(<any>mongoose).Promise = Promise;
const Schema = mongoose.Schema;

const OrganizationSchema = new Schema({
  name: {type: String, required: true},
  website: {type: String},
  timeCreated: {type: Date, default: Date.now},
  logo: {type: String},
  phoneNumber: {type: String},
  userCount: {type: Number},
  defaultRole: {type: String, default: 'member'},
});

OrganizationSchema.index({name: 'text'});
OrganizationSchema.methods.frontendData = function() {
  return {
    id: this._id,
    name: this.name,
    website: this.website,
    logo: this.logo,
    timeCreated: this.timeCreated,
    phoneNumber: this.phoneNumber,
    userCount: this.userCount,
  };
};

module.exports = mongoose.model('Organization', OrganizationSchema);
