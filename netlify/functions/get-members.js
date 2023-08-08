// In your server-side code (e.g., a new file called "get-members.js")

import dotenv from "dotenv";
import mysql from 'mysql';

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

export const handler = async (event) => {
  try {
    const members = await new Promise((resolve, reject) => {
      db.query('SELECT id, username, email FROM members', function (err, results, fields) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify(members)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};
