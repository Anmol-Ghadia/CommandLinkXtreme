const nodemailer = require('nodemailer');
require('dotenv').config();

const EMAIL_SENDER = process.env.EMAIL_SENDER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
        user: EMAIL_SENDER,
        pass: EMAIL_PASS,
    },
});

// send mail with defined transport object
export const sendMail = (from:string, to: string, sessionId: number): void => {
    // TODO !!! add checks in from and to strings
    const mailOptions = {
        from: EMAIL_SENDER,
        to: to,
        subject: `${sessionId} - Session ID for Command Link chat`,
        text: getPlainTextBody(from,sessionId),
        html: getHtmlBody(from,sessionId)
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

function getPlainTextBody(alias:string,sessionId:number) {
    return `Command Link
Hello there,

${alias} has invited you to join a chat session(${sessionId}).

Visit http://localhost:3000/join/${sessionId} to join ${alias}.

If you don't recognize the username, please ignore this email.
Thank you!`;
}

function getHtmlBody(alias:string,sessionId:number) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Chat Session Invitation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            padding: 20px;
            background-color: #ffffff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            margin: 20px auto;
            max-width: 600px;
        }
        .header {
            background-color: #4CAF50;
            padding: 10px;
            text-align: center;
            color: #ffffff;
        }
        .content {
            padding: 20px;
            text-align: center;
        }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            margin: 20px 0;
            color: #ffffff;
            background-color: #4CAF50;
            text-decoration: none;
            border-radius: 5px;
        }
        .footer {
            padding: 10px;
            text-align: center;
            color: #999999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Command Link</h1>
        </div>
        <div class="content">
            <p>Hello there,</p>
            <p>${alias} has invited you to join a chat session(${sessionId}).</p>
            <p>Click the button below to join the chat:</p>
            <a href="http://localhost:3000/join/${sessionId}" class="btn">Join ${alias}</a>
        </div>
        <div class="footer">
            <p>If you don't recognize the username, please ignore this email.</p>
            <p>Thank you!</p>
        </div>
    </div>
</body>
</html>`
}
