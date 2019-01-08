import mongoose from 'mongoose';
import validate from 'mongoose-validator';

const userSchema = mongoose.Schema({
    username:{
        type: String, 
        unique: true, 
        required: [true, "Este campo Usuario es requerido"],
        validate: [
            validate({
                validator: 'isLength', 
                arguments:[6,15],
                message: 'Nombre de usuario debe contener entre {ARGS[0]} y {ARGS[1]}'
            }),
            validate({
                validator: 'isAlphanumeric', 
                message: 'Nombre de usuario debe ser alphanumerico'
            })
        ]
    },
    fullname:String,
    password:String,
    desc: String,
    bio: String,
    email:{
        type: String,
        unique: true,
        validate: validate({
            validator: 'isEmail', 
            message: 'Instroduce un Email valido'
        })
    },
    thumbnail: String,
    post:{type:[], default:[]},
    followers:{type:[], default:[]}
});

const userModel = mongoose.model('User', userSchema);

export default userModel ;