// get-locations.js

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
export async function handler(event) {
  try {
    // Perform a query to retrieve locations
    const locationsQuery = `
      SELECT id, location
      FROM locations
    `;

    const locations = await new Promise((resolve, reject) => {
      db.query(locationsQuery, function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    // Return the retrieved locations as a JSON response
    return {
      statusCode: 200,
      body: JSON.stringify(locations)
    };
  } catch (error) {
    // If an error occurs, return an internal server error response
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
}
