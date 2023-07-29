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

            // Insert the new member into the database along with created_date and modified_date
            const newMember = await new Promise((resolve, reject) => {
                db.query(
                    'INSERT INTO members (username, email, password, created_date, modified_date) VALUES (?, ?, ?, ?, ?)',
                    [username, email, password, currentDate, currentDate],
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
                body: JSON.stringify({ message: "Member inserted successfully" })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        };
    }
};
