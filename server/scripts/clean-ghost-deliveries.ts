import mongoose from 'mongoose';
import DeliveryModel from '../src/modules/delivery/infrastructure/delivery.model.js';
import OrderModel from '../src/modules/order/infrastructure/order.model.js';
import { DeliveryStatus } from '../../shared-domain/src/delivery/delivery-status.js';
import { OrderStatus } from '../../shared-domain/src/order/order-status.js';

async function cleanGhostDeliveries() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-manager';
  await mongoose.connect(mongoUri);

  console.log('🔍 Buscando deliveries fantasmas...\n');

  const pendingDeliveries = await DeliveryModel.find({ status: DeliveryStatus.PENDING }).lean();
  console.log(`📊 Total deliveries PENDING: ${pendingDeliveries.length}`);

  let ghostCount = 0;
  const ghostsToDelete: string[] = [];
  const ghostsToCancel: string[] = [];

  for (const delivery of pendingDeliveries) {
    const order = await OrderModel.findById(delivery.orderId).lean();

    if (!order) {
      console.log(`❌ Ghost: Delivery ${delivery._id} - Orden ${delivery.orderId} NO EXISTE`);
      ghostsToDelete.push(delivery._id.toString());
      ghostCount++;
    } else if (order.status === OrderStatus.CANCELLED) {
      console.log(`⚠️  Ghost: Delivery ${delivery._id} - Orden ${order._id} está CANCELADA`);
      ghostsToCancel.push(delivery._id.toString());
      ghostCount++;
    } else if (!order.deliveryCost || order.deliveryCost === 0) {
      console.log(
        `❌ Ghost: Delivery ${delivery._id} - Orden ${order._id} tiene deliveryCost=${order.deliveryCost || 0}`,
      );
      ghostsToDelete.push(delivery._id.toString());
      ghostCount++;
    }
  }

  console.log(`\n📈 Resumen:`);
  console.log(`  - Deliveries a ELIMINAR (huérfanos): ${ghostsToDelete.length}`);
  console.log(`  - Deliveries a CANCELAR (orden cancelada): ${ghostsToCancel.length}`);
  console.log(`  - Total fantasmas: ${ghostCount}\n`);

  if (ghostCount > 0) {
    console.log('🗑️  Ejecutando limpieza...');

    if (ghostsToDelete.length > 0) {
      const deleteResult = await DeliveryModel.deleteMany({
        _id: { $in: ghostsToDelete },
      });
      console.log(`✅ Eliminados: ${deleteResult.deletedCount} deliveries`);
    }

    if (ghostsToCancel.length > 0) {
      const cancelResult = await DeliveryModel.updateMany(
        { _id: { $in: ghostsToCancel } },
        { $set: { status: DeliveryStatus.CANCELLED } },
      );
      console.log(`✅ Cancelados: ${cancelResult.modifiedCount} deliveries`);
    }
  } else {
    console.log('✨ No se encontraron deliveries fantasmas');
  }

  await mongoose.disconnect();
  console.log('\n🏁 Limpieza completada');
}

cleanGhostDeliveries().catch(console.error);
