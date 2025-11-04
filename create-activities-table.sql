-- Create activities table for logging all business events
CREATE TABLE IF NOT EXISTS activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM(
    'purchase_order_created',
    'purchase_order_updated',
    'purchase_order_sent',
    'purchase_order_approved',
    'purchase_order_received',
    'sales_order_created',
    'sales_order_confirmed',
    'invoice_created',
    'manufacturing_started',
    'manufacturing_completed',
    'shipment_created',
    'shipment_dispatched',
    'shipment_delivered',
    'material_receipt',
    'material_verification',
    'production_approval',
    'challan_created',
    'production_request_created',
    'grn_created',
    'other'
  ) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message LONGTEXT NOT NULL,
  department ENUM('sales', 'procurement', 'manufacturing', 'inventory', 'shipment', 'finance', 'admin') NOT NULL,
  order_number VARCHAR(100) NULL,
  related_entity_id INT NULL,
  related_entity_type VARCHAR(100) NULL,
  amount DECIMAL(15, 2) NULL,
  created_by INT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_created_at (created_at),
  INDEX idx_type (type),
  INDEX idx_department (department),
  INDEX idx_order_number (order_number),
  INDEX idx_related_entity (related_entity_type, related_entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;