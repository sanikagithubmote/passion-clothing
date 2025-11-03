const db = require('./server/config/database');
const fs = require('fs');

async function checkDocument() {
  try {
    const doc = await db.DocumentAttachment.findByPk(2);
    if (!doc) {
      console.log('❌ Document ID 2 not found in database');
      return;
    }
    
    console.log('📄 Document Details:');
    console.log('ID:', doc.id);
    console.log('File Name:', doc.file_name);
    console.log('File Path:', doc.file_path);
    console.log('File Size:', doc.file_size);
    console.log('File Type:', doc.file_type);
    console.log('Entity Type:', doc.entity_type);
    console.log('Entity ID:', doc.entity_id);
    console.log('Document Type:', doc.document_type);
    console.log('Created At:', doc.created_at);
    
    console.log('\n🔍 File System Check:');
    console.log('Path exists:', fs.existsSync(doc.file_path) ? '✅ YES' : '❌ NO');
    
    if (fs.existsSync(doc.file_path)) {
      const stats = fs.statSync(doc.file_path);
      console.log('Actual file size:', stats.size, 'bytes');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkDocument();
