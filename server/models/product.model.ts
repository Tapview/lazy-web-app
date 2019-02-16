import * as mongoose from 'mongoose';
(<any>mongoose).Promise = Promise;
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  productId: {type: String, required: true},
  productName: {type: String, required: true},
  category: [{type: String, required: true}],
  description: {type: String, required: true},
  productImage: {type: String},
});

ProductSchema.index({productName: 'text'} );
ProductSchema.index({category: 1});


module.exports = mongoose.model('Product', ProductSchema);

