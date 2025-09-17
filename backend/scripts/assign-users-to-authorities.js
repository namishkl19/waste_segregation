// Script to assign 10 users to each authority in the database
const { User } = require('../models');

async function assignUsersToAuthorities() {
  try {
    // Get all authorities
    const authorities = await User.findAll({ where: { role: 'authority' } });
    if (!authorities.length) throw new Error('No authorities found');

    // Get all users (excluding authorities)
    const users = await User.findAll({ where: { role: 'user' } });
    if (!users.length) throw new Error('No users found');

    let userIndex = 0;
    for (const authority of authorities) {
      // Assign 10 users to this authority
      for (let i = 0; i < 10 && userIndex < users.length; i++, userIndex++) {
        await users[userIndex].update({ authorityId: authority.id });
        console.log(`Assigned user ${users[userIndex].id} to authority ${authority.id}`);
      }
    }
    console.log('Assignment complete.');
  } catch (err) {
    console.error('Error assigning users:', err);
  }
}

// Run the assignment
assignUsersToAuthorities();
