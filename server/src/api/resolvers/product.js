export default {
  Query: {
    getProduct: (parent, args, { models: { Product } }) =>
      Product.findOne(args).exec().catch((err) => console.error(err)),
    getAllProducts: (parent, { limite, offset }, { models: { Product } }) =>
      Product.find({})
        .limit(limite)
        .skip(offset)
        .exec()
        .catch((err) => console.error(err)),
    totalProducts: (parent, args, { models: { Product } }) =>
      Product.countDocuments().exec().catch((err) => console.error(err)),
  },
  Mutation: {
    setProduct: async (parent, args, { models: { Product } }) => {
      try {
        const product = new Product(args.input);
        await product.save();

        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    updateProduct: async (parent, args, { models: { Product } }) => {
      try {
        const { input } = args;
        const { nombre, precio, stock } = input;
        const argsInput = { nombre, precio, stock };
        await Product.findOneAndUpdate({ _id: input._id }, argsInput, {
          new: false,
        });

        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    deleteProduct: async (parent, args, { models: { Product } }) => {
      try {
        await Product.findOneAndDelete(args)
          .then("Cliente Eliminado")
          .catch((err) => {
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
