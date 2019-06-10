import mongoose, { Schema } from 'mongoose';
// import validate from 'mongoose-validator';

const clientSchema = Schema({
    nombre:String,
    apellido:String,  
    empresa: String,
    emails:{
        type:[],
        default:[],
    },
    edad: Number,
    tipo: String,
    pedidos:{type:[], default:[]},
    sellerID:mongoose.Types.ObjectId
});

const clientModel = mongoose.model('Client', clientSchema);

export default clientModel ;