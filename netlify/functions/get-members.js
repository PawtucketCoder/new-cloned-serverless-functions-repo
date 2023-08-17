/*
  File Type: Get Members Handler
  Description: This file contains a Lambda function for fetching member information from the database.
  Author: PawtucketCoder

  Important Note: Make sure to set up environment variables for the following values:
  - DB_HOST: Database host address
  - DB_USER: Database username
  - DB_PASSWORD: Database password
  - DB_DATABASE: Database name

  Dependencies:
  - dotenv: Library for loading environment variables from a .env file
  - mysql: MySQL database driver
*/

// Import required libraries
import dotenv from "dotenv"; // Library for loading environment variables
import mysql from 'mysql'; // MySQL database driver

// Load environment variables from .env file
dotenv.config();

// Create a MySQL database connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: 3306,
  acquireTimeout: 1000000,
  connectTimeout: 300000
});

// Lambda function for fetching member information from the database
export const handler = async (event) => {
  try {
    // Retrieve member data from the database
    const members = await new Promise((resolve, reject) => {
      db.query('SELECT id, username, email FROM members', function (err, results, fields) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    // Return fetched member data
    return {
      statusCode: 200,
      body: JSON.stringify(members)
    };
  } catch (error) {
    // Handle internal server error
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};
