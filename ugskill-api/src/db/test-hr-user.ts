import { db } from '../config/postgres';
import { users } from './pg/schema/core';

async function main() {
  try {
    const allUsers = await db.select().from(users);
    console.log('--- ALL USERS IN POSTGRES ---');
    console.log(allUsers.map(u => ({ id: u.id, email: u.email, roles: u.roles, fullName: u.fullName })));
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

main();
