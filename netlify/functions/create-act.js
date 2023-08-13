import dotenv from "dotenv";
import mysql from 'mysql';
// import bcrypt from 'bcrypt';

dotenv.config();

const { POSTMARK_API_KEY } = process.env
const serverToken = POSTMARK_API_KEY
// let postmark = require("postmark")
// let client = new postmark.ServerClient(serverToken);

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: 3306,
  acquireTimeout: 1000000,
  connectTimeout: 300000
});

const saltRounds = 10;

export const handler = async (event) => {  
  try {
    const body = JSON.parse(event.body);
    const { name, location, genre, bio } = body;

    // Check if the act already exists in the database
    const existingAct = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM acts WHERE name=? AND location=?', [name, location],
        function (err, results, fields) {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        }
      );
    });

    if (existingAct.length > 0) {
      // Act already exists, return an error
      return {
        statusCode: 409,
        body: JSON.stringify({ message: "Name and Location already exists" })
      };
    } else {
      // Get the current date and time in MySQL compatible format
      const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

      // Insert the new act into the database along with created_date and modified_date
      const newMember = await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO acts (name, location, genre, bio, created_date, modified_date) VALUES (?, ?, ?, ?, ?, ?)',
          [name, location, genre, bio, currentDate, currentDate],
          function (err, results, fields) {
            if (err) {
              reject(err);
            } else {
              resolve(results);
            }
          }
        );
      });
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Act created" })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};
