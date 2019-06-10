import mongoose, { Schema } from 'mongoose';
// import validate from 'mongoose-validator';

const productSchema = Schema({
    nombre:String,
    precio:Number,
    stock:Number
});

const productModel = mongoose.model('Product', productSchema);

export default productModel ;