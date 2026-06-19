import mongoose from "mongoose";

export default {
  Query: {
    getAllClients: (
      parent,
      { limite, offset, sellerID },
      { models: { Client } },
    ) => {
      let idSistem = { sellerID };
      if (!sellerID) idSistem = {};
      return Client.find(idSistem).limit(limite).skip(offset).exec();
    },
    getClient: (parent, args, { models: { Client } }) => Client.findOne(args).exec(),
    totalClients: (parent, args, { models: { Client } }) =>
      Client.countDocuments(args).exec().catch((err) => console.error(err)),
  },
  Mutation: {
    setClient: async (parent, args, { models: { Client } }) => {
      try {
        const client = new Client(args.input);
        await client.save().catch((err) => {
          throw err;
        });
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    updateClient: async (parent, args, { models: { Client } }) => {
      try {
        const { input } = args;
        const { nombre, apellido, empresa, edad, emails, tipo } = input;
        const argsInput = { nombre, apellido, empresa, edad, emails, tipo };
        await Client.findOneAndUpdate({ _id: input._id }, input, {
          new: false,
        }).catch((err) => {
          throw err;
        });
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    deleteClient: async (parent, args, { models: { Client } }) => {
      try {
        await Client.findOneAndDelete(args).catch((err) => {
          throw err;
        });
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
  },
};
