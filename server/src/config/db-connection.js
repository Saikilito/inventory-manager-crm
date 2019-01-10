import mongoose from 'mongoose';
import config from './';

const db = () => {
	
	const mongoConfig = {
		useNewUrlParser: true,
		useCreateIndex: true
	}

    mongoose.connect(config.database, mongoConfig)
        .then(() => {
		    console.log('Conectado a mongo!');

		    const ObjectId = mongoose.Types.ObjectId;
		    ObjectId.prototype.valueOf = function() {
		    return this.toString();
		};
	});
};
export default db;