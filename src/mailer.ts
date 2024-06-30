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


export const sendMail = (to: string, text: string): void => {
    const mailOptions = {
        from: EMAIL_SENDER,
        to: to,
        subject: 'You have been invited for a new conversatoin! Click the link below to join.',
        text: text,
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}
