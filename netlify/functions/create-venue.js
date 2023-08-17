// Import required packages and libraries
import dotenv from "dotenv";
import mysql from 'mysql';

// Load environment variables from .env file
dotenv.config();

// Create a database connection pool using environment variables
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: 3306,
  acquireTimeout: 1000000,
  connectTimeout: 300000
});

// Define the main Lambda function handler
export const handler = async (event) => {
  try {
    // Parse the incoming request body containing venue information
    const body = JSON.parse(event.body);
    const { name, location, capacity, type, description, contact, imageURL, socialMedia } = body;

    // Check if the location exists in the locations table
    const locationQuery = 'SELECT id FROM locations WHERE location = ?';
    let locationId = await new Promise((resolve, reject) => {
      db.query(locationQuery, [location], function (err, results) {
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

    // If location doesn't exist, insert it into locations table
    if (!locationId) {
      locationId = await new Promise((resolve, reject) => {
        db.query('INSERT INTO locations (location) VALUES (?)', [location], function (err, results) {
          if (err) {
            reject(err);
          } else {
            resolve(results.insertId); // Get the newly inserted location's ID
          }
        });
      });
    }

    // Check if the venue already exists in the database
    const existingVenue = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM venues WHERE name=? AND location_id=?', [name, locationId],
        function (err, results) {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        }
      );
    });

    // If venue already exists, return a conflict response
    if (existingVenue.length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: "Name and Location already exist" })
      };
    } else {
      // Get the current date and time in MySQL compatible format
      const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

      // Insert the new venue into the database along with created_date and modified_date
      await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO venues (name, location_id, capacity, type, description, contact, image_url, social_media, created_date, modified_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [name, locationId, capacity, type, description, contact, imageURL, socialMedia, currentDate, currentDate],
          function (err, results) {
            if (err) {
              reject(err);
            } else {
              resolve(results);
            }
          }
        );
      });

      // Return a success response
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Venue created" })
      };
    }
  } catch (error) {
    // If an error occurs, log it and return an internal server error response
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};
