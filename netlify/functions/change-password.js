// change-password.js

import dotenv from "dotenv";
import mysql from 'mysql';
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

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { username, currentPassword, newPassword } = body;

    // Check if the member exists in the database
    const existingMember = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM members WHERE username=?', [username],
        function (err, results, fields) {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        }
      );
    });

    if (existingMember.length === 0) {
      // Member does not exist, return an error
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Member not found" })
      };
    } else {
      // Check if the current password matches the one in the database
      const passwordMatches = await bcrypt.compare(
        currentPassword,
        existingMember[0].password
      );

      if (!passwordMatches) {
        // Current password doesn't match, return an error
        return {
          statusCode: 401,
          body: JSON.stringify({ message: "Invalid current password" })
        };
      }

      // Hash the new password using bcrypt
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update the member's password in the database
      await new Promise((resolve, reject) => {
        db.query(
          'UPDATE members SET password=?, modified_date=? WHERE username=?',
          [hashedNewPassword, new Date().toISOString().slice(0, 19).replace('T', ' '), username],
          function (err, results, fields) {
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
        body: JSON.stringify({ message: "Password changed successfully" })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};
