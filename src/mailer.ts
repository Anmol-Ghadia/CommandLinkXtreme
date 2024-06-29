const nodemailer = require('nodemailer');
require('dotenv').config();

const EMAIL_SENDER = process.env.EMAIL_SENDER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const TEST_RECEIVER = process.env.TEST_RECEIVER;

const transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
        user: EMAIL_SENDER,
        pass: EMAIL_PASS,
    },
});

const mailOptions = {
    from: EMAIL_SENDER,
    to: TEST_RECEIVER,
    subject: 'You have been invited to a session, click the link below to join',
    text: 'Link',
    // html: '<p>HTML content of your email</p>', // Optional
  };
  


export const sendMail = async (to: string, text: string) => {
    try {
        await transporter.sendMail({
            from: EMAIL_SENDER,
            to: to,
            subject: 'You have been invited to a session, click the link below to join',
            text: text,
        });
    } catch (error) {
        console.log(error);
    }
};
