import dotenv from "dotenv";
import mysql from 'mysql';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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

function generateAccessToken(email, username) {
  return jwt.sign({ email, username }, process.env.TOKEN_SECRET, { expiresIn: '1h' }); // Set an appropriate expiration time
}

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { email, verificationCode } = body;

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
      const hashedVerificationCode = existingMember[0].verification_code;
      const username = existingMember[0].username;
      const isVerificationCodeCorrect = await bcrypt.compare(verificationCode, hashedVerificationCode);
      const tokenValue = generateAccessToken(email, username);

      if (isVerificationCodeCorrect) {
        // Password is correct, return a JWT access token
        return {
          statusCode: 200,
          headers: {
            'Set-Cookie': `token=${tokenValue}; Path=/`
          },
          body: JSON.stringify({ message: 'Verification Code Accepted' })
        };
      } else {
        // Password is incorrect, return an error
        return {
          statusCode: 401,
          body: JSON.stringify({ message: 'Incorrect Verification Code' })
        };
      }
    } else {
      // Member does not exist, return an error
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Member Verification Denied' })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};