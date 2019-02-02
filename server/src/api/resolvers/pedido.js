export default{
    Query:{
        getOrder: (parent, args, {models:{Order}})=> Order.findOne(args).catch((err)=>console.error(err)),
        getOrderClient: (parent, args, {models:{Order}})=>{
            const pedidos = Order.find({cliente: args.client})
            .catch(err=> console.error(err))
            return pedidos
        },
        getAllOrders: (parent, {limite, offset}, {models:{Order}})=> Order.find({}).limit(limite).skip(offset).catch((err)=>console.error(err)),
        totalOrders: (parent, args, {models:{Order}}) => Order.countDocuments().catch((err)=>console.error(err))
    },
    Mutation:{
        setOrder: async (parent, args, {models:{Order}}) =>{
            try{
                console.log("Recibiendo-------", args)
                const order = new Order({
                    ...args.input,
                    fecha: new Date(),
                    estado: "PENDIENTE"
                })

                await order.save()
                            .then( resp => console.log(resp))
                            .catch( err => {throw err} )
                return true
            }
            catch(err){
                console.log(err)
                return false
            }
        },
        updateOrder: async (parent, args, {models:{Order, Product}})=>{
            try{
                const {input} = args;
                console.log("inputID", args)
                await Order.findOneAndUpdate({_id: input._id},input, {new:false})
                            .then( resp => console.log("Mongo",resp))
                            .catch( err => {throw err} )

                let operacion ='';
                if(input.estado === 'COMPLETADO' ) operacion = '-'
                else if (input.estado === 'CANCELADO') operacion = '+'
            
                
                await args.input.pedido.forEach(order => {
                    Product.findOneAndUpdate({_id:order._id},
                        {
                            "$inc":{ "stock": `${operacion}${order.cantidad}`   }
                        },
                        {new:false}
                    )
                    .catch(err => {throw err})
                })
                return true
            }
            catch(err){
                console.error(err)
                return false;
            }
        },
        deleteOrder: async(parent, args, {models:{Order}})=>{
            try{                
                await Order.findOneAndDelete(args)
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