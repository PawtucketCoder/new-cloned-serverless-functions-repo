import dotenv from "dotenv";
import mysql from 'mysql';
import jwt from 'jsonwebtoken';

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: 3306,
  acquireTimeout: 1000000,
  connectTimeout: 300000
});

function generateAccessToken(email) {
    return jwt.sign(email, process.env.TOKEN_SECRET);
  }

export const handler = async (event) => {
    const body = JSON.parse(event.body);
    const { email, password } = body;

    return {
        statusCode: 200,
        body: JSON.stringify(generateAccessToken(email))
    };
};