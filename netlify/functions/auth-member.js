import dotenv from "dotenv";
import jwt from 'jsonwebtoken';

dotenv.config();

function authenticateAccessToken(token) {
    return jwt.verify(token, process.env.TOKEN_SECRET);
  }

export const handler = async (event) => {
    const body = JSON.parse(event.body);
    const { token } = body;

    return {
        statusCode: 200,
        body: JSON.stringify({ message: authenticateAccessToken(token)})
    };
};