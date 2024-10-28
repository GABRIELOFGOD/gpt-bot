// // repositories/UserRepository.ts
// import dbConfig from '../config/database.config';
// import { User } from '../models/User';

// export class UserRepository {
//   // Dependency injection for database connection
//   constructor(private readonly connection = dbConfig()) {}

//   async createUser(user: User): Promise<void> {
//     const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
//     await this.connection.execute(query, [user.name, user.email, user.password]);
//   }

//   // Additional CRUD methods as needed
// }
