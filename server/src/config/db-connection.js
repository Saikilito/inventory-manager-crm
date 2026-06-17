import mongoose from 'mongoose';
import config from './index.js';

const db = () => {
    mongoose.connect(config.database)
        .then(() => {
            console.log('Conectado a mongo!');

            const ObjectId = mongoose.Types.ObjectId;
            ObjectId.prototype.valueOf = function() {
                return this.toString();
            };
        });
};
export default db;
