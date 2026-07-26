import { makeProductMongooseRepository } from '../../modules/product/infrastructure/repositories/product-mongoose.repository.js';
import { GetProduct, makeGetProduct } from '../../modules/product/application/use-cases/get-product.js';
import { GetAllProducts, makeGetAllProducts } from '../../modules/product/application/use-cases/get-all-products.js';
import { TotalProducts, makeTotalProducts } from '../../modules/product/application/use-cases/total-products.js';
import { CreateProduct, makeCreateProduct } from '../../modules/product/application/use-cases/create-product.js';
import { UpdateProduct, makeUpdateProduct } from '../../modules/product/application/use-cases/update-product.js';
import { DeleteProduct, makeDeleteProduct } from '../../modules/product/application/use-cases/delete-product.js';
import { CreateStockLot, makeCreateStockLot } from '../../modules/product/application/use-cases/create-stock-lot.js';
import { CompleteStockLot, makeCompleteStockLot } from '../../modules/product/application/use-cases/complete-stock-lot.js';
import { UpdateStockLot, makeUpdateStockLot } from '../../modules/product/application/use-cases/update-stock-lot.js';
import { GetStockLots, makeGetStockLots } from '../../modules/product/application/use-cases/get-stock-lots.js';
import { IProductRepository } from '../../modules/product/application/repositories/product.repository.js';
import { IStockLotRepository } from '../../modules/product/application/repositories/stock-lot.repository.js';
import { makeStockLotMongooseRepository } from '../../modules/product/infrastructure/repositories/stock-lot-mongoose.repository.js';
import { LibrarianService } from '../../modules/knowledge/application/services/librarian.service.js';
import { IAccountRepository, ITransactionRepository, IFinancialDayRepository } from '../../modules/financial/application/repositories/financial.repository.js';
import { IAccountsPayableRepository } from '../../modules/financial/application/repositories/accounts-payable.repository.js';
import { makeAccountsPayableMongooseRepository } from '../../modules/financial/infrastructure/repositories/accounts-payable-mongoose.repository.js';
import { IExpenseRepository } from '../../modules/expense/application/repositories/expense.repository.js';

import { IdVO } from '../../../../shared-domain/src/shared/value-objects/id.vo.js';

export interface ProductSubContainer {
  getProduct: GetProduct;
  getAllProducts: GetAllProducts;
  totalProducts: TotalProducts;
  createProduct: CreateProduct;
  updateProduct: UpdateProduct;
  deleteProduct: DeleteProduct;
  createStockLot: CreateStockLot;
  completeStockLot: CompleteStockLot;
  updateStockLot: UpdateStockLot;
  getStockLots: GetStockLots;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic stock lot return type */
  getStockLot: (id: string) => Promise<any>;
  stockLotRepository: IStockLotRepository;
}

export const buildProductModule = (deps: {
  productRepository?: IProductRepository;
  librarian?: LibrarianService;
  accountRepository?: IAccountRepository;
  transactionRepository?: ITransactionRepository;
  financialDayRepository?: IFinancialDayRepository;
  accountsPayableRepository?: IAccountsPayableRepository;
  expenseRepository?: IExpenseRepository;
}): ProductSubContainer => {
  const productRepository = deps.productRepository ?? makeProductMongooseRepository();
  const stockLotRepository = makeStockLotMongooseRepository();
  const accountsPayableRepository = deps.accountsPayableRepository ?? makeAccountsPayableMongooseRepository();
  
  const createStockLot = makeCreateStockLot({
    productRepository,
    stockLotRepository,
    accountRepository: deps.accountRepository!,
    transactionRepository: deps.transactionRepository!,
    financialDayRepository: deps.financialDayRepository!,
    accountsPayableRepository,
  });

  const completeStockLot = makeCompleteStockLot({
    productRepository,
    stockLotRepository,
    accountRepository: deps.accountRepository!,
    transactionRepository: deps.transactionRepository!,
    financialDayRepository: deps.financialDayRepository!,
    accountsPayableRepository,
  });
  
  return {
    getProduct: makeGetProduct(productRepository),
    getAllProducts: makeGetAllProducts(productRepository),
    totalProducts: makeTotalProducts(productRepository),
    createProduct: makeCreateProduct({ productRepository, librarian: deps.librarian }),
    updateProduct: makeUpdateProduct(productRepository),
    deleteProduct: makeDeleteProduct(productRepository),
    createStockLot,
    completeStockLot,
    updateStockLot: makeUpdateStockLot(stockLotRepository),
    stockLotRepository,
    getStockLots: makeGetStockLots({ stockLotRepository }),
    getStockLot: async (id: string) => {
      const result = await stockLotRepository.getById(IdVO.create(id));
      return result.isFailure ? null : result.getValue();
    },
  };
};
