import mongoose  from 'mongoose';
import config from '.'
let db;

module.exports = () => {
    if(!db){
        mongoose.connect(config.database, {useNewUrlParser: true})
            .then(()=>{
                console.log('Conectado a mongo!');
                
                const ObjectId = mongoose.Types.ObjectId;
                ObjectId.prototype.valueOf = function () {
                	return this.toString();
                };
            })
    }

    return db;
}


