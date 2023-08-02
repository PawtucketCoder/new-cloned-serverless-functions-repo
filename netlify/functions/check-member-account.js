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
    const body = JSON.parse(event.body);
    const { email } = body;

    // Check if the member exists in the database
    const existingMember = await new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) AS count FROM members WHERE email=?', [email],
        function (err, results, fields) {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        }
      );
    });

    const accountExists = existingMember[0].count > 0;

    return {
      statusCode: 200,
      body: JSON.stringify({ exists: accountExists })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while checking the account.' })
    };
  }
};
