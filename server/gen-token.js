require('dotenv').config();
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 'd0000004-0000-0000-0000-000000000003', role: 'client' }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '1h' });
console.log(token);
