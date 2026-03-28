// import * as mysql from 'mysql2/promise'
// import { Database } from '../database.js'

// export class UserModel {
//   id: number
//   email: string
//   password: string
//   created_at: Date
//   constructor(data: Partial<UserModel>) {
//     this.fill(data)
//   }
//   static async create(data: { name: string; email: string; password: string }): Promise<UserModel> {
//     const connection = Database.getInstance()
//     const { name, email, password } = data
//     try {
//       const createdAt = new Date()

//       const [userResult] = await connection.execute<mysql.ResultSetHeader>(
//         'INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)',
//         [name, email, password, createdAt]
//       )
//       return new UserModel({
//         ...data,
//         id: userResult.insertId,
//         created_at: createdAt
//       })
//     }
//   }
//   update() {}
//   delete() {}
//   static findById() {}
//   static findByEmail(email: string): Promise<UserModel> {}
//   static findAll() {}

//   fill(data: Partial<UserModel>): void {
//     if (data.id !== undefined) this.id = data.id
//     if (data.email !== undefined) this.email = data.email
//     if (data.password !== undefined) this.password = data.password
//     if (data.created_at !== undefined) this.created_at = data.created_at
//   }
// }
// // const userModel = new UserModel({data})
// // userModel.update()
// // userModel.delete()
import * as mysql from 'mysql2/promise'
import { Database } from '../database.js'

export class UserModel {
  id: number
  email: string
  password: string
  created_at: Date

  constructor(data: Partial<UserModel>) {
    this.fill(data)
  }

  static async create(data: { name: string; email: string; password: string }): Promise<UserModel> {
    const connection = Database.getInstance()
    const { name, email, password } = data
    const createdAt = new Date()

    const [userResult] = await connection.execute<mysql.ResultSetHeader>(
      'INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)',
      [name, email, password, createdAt]
    )

    return new UserModel({
      ...data,
      id: userResult.insertId,
      created_at: createdAt
    })
  }

  update() {}
  delete() {}
  static findById() {}
  static findByEmail(_email: string): Promise<UserModel> {}
  static findAll() {}

  fill(data: Partial<UserModel>): void {
    if (data.id !== undefined) this.id = data.id
    if (data.email !== undefined) this.email = data.email
    if (data.password !== undefined) this.password = data.password
    if (data.created_at !== undefined) this.created_at = data.created_at
  }
}