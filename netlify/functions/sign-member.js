/*
  File Type: Authentication Sign In Handler
  Description: This file contains a Lambda function for handling member sign-in and authentication.
  Author: PawtucketCoder

  Important Note: Make sure to set up environment variables for the following values:
  - DB_HOST: Database host address
  - DB_USER: Database username
  - DB_PASSWORD: Database password
  - DB_DATABASE: Database name
  - TOKEN_SECRET: Secret key for JWT token generation

  Dependencies:
  - dotenv: Library for loading environment variables from a .env file
  - mysql: MySQL database driver
  - jwt: JSON Web Token library for token generation
  - bcrypt: Library for hashing and comparing passwords securely
*/

// Import required libraries
import dotenv from "dotenv"; // Library for loading environment variables
import mysql from 'mysql'; // MySQL database driver
import jwt from 'jsonwebtoken'; // JSON Web Token library
import bcrypt from 'bcrypt'; // Library for password hashing

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

// Number of rounds for bcrypt password hashing
const saltRounds = 10;

// Function to generate a JWT access token
function generateAccessToken(email, username) {
  return jwt.sign({ email, username }, process.env.TOKEN_SECRET, { expiresIn: '1h' }); // Set an appropriate expiration time
}

// Lambda function for handling member sign-in and authentication
export const handler = async (event) => {
  try {
    // Parse the request body
    const body = JSON.parse(event.body);
    const { email, password } = body;

    // Check if the member already exists in the database
    const existingMember = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM members WHERE email=?', [email],
        function (err, results, fields) {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        }
      );
    });

    if (existingMember.length > 0) {
      // Member exists, compare the hashed password
      const hashedPassword = existingMember[0].password;
      const username = existingMember[0].username;
      const isPasswordCorrect = await bcrypt.compare(password, hashedPassword);
      const tokenValue = generateAccessToken(email, username);

      if (isPasswordCorrect) {
        // Password is correct, return a JWT access token
        return {
          statusCode: 200,
          headers: {
            'Set-Cookie': `token=${tokenValue}; Path=/`
          },
          body: JSON.stringify({ message: 'Password Accepted' })
        };
      } else {
        // Password is incorrect, return an error
        return {
          statusCode: 401,
          body: JSON.stringify({ message: 'Sign In Denied' })
        };
      }
    } else {
      // Member does not exist, return an error
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Sign In Denied' })
      };
    }
  } catch (error) {
    // Handle internal server error
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};
