import { MongoClient, Db } from 'mongodb';
import 'dotenv/config';

const client = new MongoClient(process.env.MONGODB_URI!);
let db: Db;

export async function connectDB() {
  await client.connect();
  db = client.db('housingiq');
  console.log('✅ MongoDB connected');
  return db;
}

export function getDB() {
  return db;
}