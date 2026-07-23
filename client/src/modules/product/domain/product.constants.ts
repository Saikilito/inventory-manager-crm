// Stock thresholds
export const STOCK_THRESHOLD_LOW = 30;
export const STOCK_THRESHOLD_MEDIUM = 100;

// Margin thresholds (percentage)
export const MARGIN_THRESHOLD_GOOD = 30;
export const MARGIN_THRESHOLD_OK = 15;

// UI timeouts
export const DELETION_SUCCESS_TIMEOUT_MS = 4000;

// User messages
export const PRODUCT_MESSAGES = {
  CREATED: 'Product created successfully',
  UPDATED: 'Product updated successfully',
  DELETED: 'Product deleted successfully',
  DELETE_FAILED: 'Delete failed',
  ERROR_LOADING: 'Error loading products',
  ERROR_CREATING: 'Error creating product',
  ERROR_UPDATING: 'Error updating product',
  ERROR_DELETING: 'Error deleting product',
  CONFIRM_DELETE: 'Are you sure you want to delete product',
} as const;
