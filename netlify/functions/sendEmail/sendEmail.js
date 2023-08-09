import dotenv from "dotenv";
dotenv.config();

const { POSTMARK_API_KEY } = process.env
const serverToken = POSTMARK_API_KEY
let postmark = require("postmark")
let client = new postmark.ServerClient(serverToken);

exports.handler = (event, context, callback) => {
  client.sendEmail(
    {
      "From": "michael.sheldon@scenejunction.com",
      "To": "michael.sheldon@scenejunction.com",
      "Subject": "Hello from Postmark",
      "HtmlBody": "<strong>Hello</strong> dear Postmark user.",
      "MessageStream": "outbound"
    },
    (error, result) => {
      if (error) {
        console.error("Error sending email:", error);
        callback(error);
      } else {
        console.log("Email sent successfully:", result);
        callback(null, {
          statusCode: 200,
          body: 'I am on my way !'
        });
      }
    }
  );
};
