require('dotenv').config();

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQwMDAwMDA0LTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMyIsInJvbGUiOiJjbGllbnQiLCJpYXQiOjE3NzY1NzM2ODQsImV4cCI6MTc3NjU3NzI4NH0.cJHU_tS3Hc10A3Wf0uwCNM8zPLIMPV_AYyO3i1fCFno';
const adId = 'f0000006-0000-0000-0000-000000000003';

async function testPayment() {
  try {
    const response = await fetch(`http://localhost:5000/api/ads/${adId}/pay`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transactionId: 'API-FETCH-VERIFY-' + Date.now(),
        amount: 25,
        paymentMethod: 'Card',
        senderName: 'Fetch Test User',
        screenshotUrl: 'https://test.com/receipt.png'
      })
    });

    const data = await response.json();
    if (response.ok) {
        console.log('SUCCESS:', data);
    } else {
        console.error('FAILED:', data);
    }
  } catch (err) {
    console.error('EXCEPTION:', err.message);
  }
}

testPayment();
