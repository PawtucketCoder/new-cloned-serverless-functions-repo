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

const saltRounds = 10;

export const handler = async (event) => {  
  try {
    const body = JSON.parse(event.body);
    const { name, location, genre, bio } = body;

    // Check if the location exists in the locations table
    let locationId = await new Promise((resolve, reject) => {
      db.query('SELECT id FROM locations WHERE location=?', [location], function (err, results) {
        if (err) {
          reject(err);
        } else {
          if (results.length > 0) {
            resolve(results[0].id);
          } else {
            resolve(null);
          }
        }
      });
    });

    if (!locationId) {
      // If location doesn't exist, insert it into locations table
      locationId = await new Promise((resolve, reject) => {
        db.query('INSERT INTO locations (location) VALUES (?)', [location], function (err, results) {
          if (err) {
            reject(err);
          } else {
            resolve(results.insertId);
          }
        });
      });
    }

    // Check if the act already exists in the database with the new locationId
    const existingAct = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM acts WHERE name=? AND location_id=?', [name, locationId], function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    if (existingAct.length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: "Name and Location already exists" })
      };
    } else {
      const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO acts (name, location_id, genre, bio, created_date, modified_date) VALUES (?, ?, ?, ?, ?, ?)',
          [name, locationId, genre, bio, currentDate, currentDate],
          function (err, results) {
            if (err) {
              reject(err);
            } else {
              resolve(results);
            }
          }
        );
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Act created" })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};
