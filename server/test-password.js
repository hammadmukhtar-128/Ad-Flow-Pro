const bcrypt = require('bcryptjs');
const hash = '$2a$10$7QJZ6Fz3ZkQ3d8kG4e6W8e1j5cYlZ0gYhH1pQXW9dR5K2y7V8dG5O';
const password = 'Hammad@146';

bcrypt.compare(password, hash).then(match => {
  console.log('Password match:', match);
});
