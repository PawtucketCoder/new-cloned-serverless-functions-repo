// get-acts.js

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
        const { location_id } = event.queryStringParameters;

        // Perform a query to retrieve acts with location information
        let actsQuery = `
            SELECT acts.*, locations.location
            FROM acts
            LEFT JOIN locations ON acts.location_id = locations.id
        `;

        // If a location_id is provided, filter acts by location_id
        if (location_id) {
            actsQuery += ` WHERE acts.location_id = ${location_id}`;
        }

        const actsWithLocations = await new Promise((resolve, reject) => {
            db.query(actsQuery, function (err, results) {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });

        // Return the retrieved acts with location information as a JSON response
        return {
            statusCode: 200,
            body: JSON.stringify(actsWithLocations)
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
