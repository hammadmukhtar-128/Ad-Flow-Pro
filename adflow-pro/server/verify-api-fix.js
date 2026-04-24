require('dotenv').config();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'adflowpro_jwt_secret_key_32chars_hammad2024xyz';
const userId = 'd0000004-0000-0000-0000-000000000001';
const role = 'client';

const token = jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '30d' });

async function verifyFix() {
  try {
    console.log('Testing Ad Creation with Standard package via API...');
    const response = await fetch('http://localhost:5000/api/ads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'API Verification Ad',
        description: 'Testing the package type constraint fix via automated script.',
        category: 'Electronics',
        city: 'Karachi',
        package: 'Standard'
      })
    });

    const data = await response.json();
    console.log('✅ API call completed!');
    console.log('Response status:', response.status);
    console.log('Created Ad Package Type:', data.package_type);
    
    if (data.package_type === 'standard') {
      console.log('✅ Fix verified: Package type was normalized to lowercase!');
    } else {
      console.log('❌ Fix failed: Package type was not normalized correctly.');
    }
  } catch (error) {
    console.error('❌ API call failed:', error.message);
  }
}

verifyFix();
