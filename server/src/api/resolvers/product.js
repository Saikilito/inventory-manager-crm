export default{
    Query:{
        getProduct: (parent, args, {models:{Product}})=> Product.findOne(args).catch((err)=>console.error(err)),
        getAllProducts: (parent, {limite, offset}, {models:{Product}})=> Product.find({}).limit(limite).skip(offset).catch((err)=>console.error(err)),
        totalProducts: (parent, args, {models:{Product}}) => Product.countDocuments().catch((err)=>console.error(err))
    },
    Mutation:{
        setProduct: async (parent, args, {models:{Product}}) =>{
            try{
                console.log("Recibiendo-------", args)
                const product = new Product(args.input)
                await product.save()
                            .then( resp => console.log(resp))
                            .catch( err => {throw err} )
                return true
            }
            catch(err){
                console.log(err)
                return false
            }
        },
        updateProduct: async (parent, args, {models:{Product}})=>{
            try{
                const {input} = args;
                console.log("inputID", args)
                const {nombre, precio, stock} = input
                const argsInput = {nombre, precio, stock}
                await Product.findOneAndUpdate({_id: input._id},argsInput, {new:false})
                            .then( resp => console.log("Mongo",resp))
                            .catch( err => {throw err} )
                return true
            }
            catch(err){
                console.error(err)
                return false;
            }
        },
        deleteProduct: async(parent, args, {models:{Product}})=>{
            try{                
                await Product.findOneAndDelete(args)
                    .then("Cliente Eliminado")
                    .catch(err=>{throw err})
                return true;
            }
            catch(err){
                console.error(err)
                return false;
            }
        }
    }
}