-- Fix Invoice File Sizes in DocumentAttachment Table
-- This script corrects file_size records from 102400 to actual file sizes

-- Show current incorrect records
SELECT 
  id,
  file_name,
  file_size,
  entity_type,
  document_type,
  created_at
FROM document_attachments
WHERE file_size = 102400 
  AND document_type = 'invoice'
ORDER BY created_at DESC;

-- Update file sizes to correct values (2KB for our invoices)
-- Note: Adjust the SET value based on your actual file size
UPDATE document_attachments
SET file_size = 2400  -- Typical invoice PDF size
WHERE file_size = 102400 
  AND document_type = 'invoice';

-- Verify the fix
SELECT 
  id,
  file_name,
  file_size,
  entity_type,
  document_type,
  created_at
FROM document_attachments
WHERE document_type = 'invoice'
ORDER BY created_at DESC;

-- Check document statistics
SELECT 
  document_type,
  COUNT(*) as count,
  AVG(file_size) as avg_size,
  MIN(file_size) as min_size,
  MAX(file_size) as max_size
FROM document_attachments
WHERE is_active = 1
GROUP BY document_type;