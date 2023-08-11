import dotenv from "dotenv";
import mysql from 'mysql';
import bcrypt from 'bcrypt';

dotenv.config();

const { POSTMARK_API_KEY } = process.env
const serverToken = POSTMARK_API_KEY
let postmark = require("postmark")
let client = new postmark.ServerClient(serverToken);

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
    const { username, email, password } = body;

    // Check if the member already exists in the database
    const existingMember = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM members WHERE username=? OR email=?', [username, email],
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
      // Member already exists, return an error
      return {
        statusCode: 409,
        body: JSON.stringify({ message: "Username or Email already exists" })
      };
    } else {
      // Get the current date and time in MySQL compatible format
      const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const verificationCode = String(Math.floor(Math.random() * (99999 - 10000 + 1) + 10000));

      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const hashedVerificationCode = await bcrypt.hash(verificationCode, saltRounds);
      console.log(hashedVerificationCode);

      // Insert the new member into the database along with created_date and modified_date
      const newMember = await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO members (username, email, password, verification_code, created_date, modified_date) VALUES (?, ?, ?, ?, ?, ?)',
          [username, email, hashedPassword, hashedVerificationCode, currentDate, currentDate],
          function (err, results, fields) {
            if (err) {
              reject(err);
            } else {
              resolve(results);
            }
          }
        );
      });

      client.sendEmail(
        {
          "From": "michael.sheldon@scenejunction.com",
          "To": "michael.sheldon@scenejunction.com",
          "Subject": "Verification Code",
          "HtmlBody": `
            <html>
              <head>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    background-color: #ccc;
                  }
                  .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    background-color: #f9f9f9;
                  }
                  .logo {
                    text-align: center;
                    margin-bottom: 20px;
                  }
                  .header {
                    font-size: 24px;
                    margin-bottom: 10px;
                  }
                  .message {
                    font-size: 16px;
                    margin-bottom: 20px;
                  }
                  .verification-code {
                    text-align: center;
                    font-size: 32px;
                    color: #007bff;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="logo">
                    <img src="https://scenejunction.com/logo-scenejunction.png" alt="Scene Junction Logo">
                  </div>
                  <div class="header">scenejunction.com</div>
                  <div class="message">
                    Hi ${username},<br>
                    Use the following one-time password (OTP) to verify your email address. You can use this email address to sign-in or recover your Scene Junction account.
                  </div>
                  <div class="verification-code"><a href="http://localhost:8888/verify-member.html?email=test@test.com">${verificationCode}</a></div>
                </div>
              </body>
            </html>
          `,
          "MessageStream": "outbound"
        }
        ,
        (error, result) => {
          if (error) {
            console.error("Error sending email:", error);
          } else {
            console.log("Email sent successfully:", result);
          }
        }
      );
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Check your email for validation code" })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};
