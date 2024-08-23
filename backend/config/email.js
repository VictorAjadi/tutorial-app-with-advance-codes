const nodemailer = require("nodemailer");
const Mailgen = require('mailgen');

const config = {
    service: process.env.SERVICE,
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASS
    }
};

const sendEmail = async (option, type) => {
    let email;
    const transporter = nodemailer.createTransport(config);

    const mailGenerator = new Mailgen({
        theme: 'default',
        product: {
            name: 'Devon Tutorial',
            link: option.link || 'http://devon.com' // Provide a default link if option.link is not provided
        }
    });
    if (type === "register") {
        const emailForRegister = {
            body: {
                name: `${option.name}`,
                intro: "Welcome to Devon! We're very excited to have you on board, Thanks for signing up with us! We hope you enjoy your time with us. Check your account to update your profile.",
                outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
                copyright: 'Copyright © 2024 Devon. All rights reserved.'
            }
        };
        email = mailGenerator.generate(emailForRegister);
    } else if (type === "reset") {
        const emailForReset = {
            body: {
                name: `${option.name}`,
                action: {
                    instructions: 'To reset your password, please click the following link below:',
                    button: {
                        color: '#ffc107',
                        text: 'Reset your password',
                        link: option.url
                    }
                },
                outro: "If you did not request a password reset, no further action is required.",
                copyright: 'Copyright © 2024 Devon. All rights reserved.'
            }
        };
        email = mailGenerator.generate(emailForReset);
    } else if (type === "request") {
        const emailForRequest = {
            body: {
                name: `${option.instructorName}`,
                intro: `Good day, my name is ${option.studentName}. I would like to apply for your course titled ${option.courseTitle}. Please kindly accept my request, thank you.`,
                outro: `If you will be putting a price on this course, please send me an email via ${option.studentEmail} to negotiate. Thanks for your time.`,
                copyright: 'Copyright © 2024 Devon. All rights reserved.'
            }
        };
        email = mailGenerator.generate(emailForRequest);
    } else if (type === "accept") {
        const emailForAccept = {
            body: {
                name: `${option.studentName}`,
                intro: `You have been accepted to access the course titled ${option.courseTitle} which you sent an enrollment request for.`,
                outro: `If you have anything to say to the course instructor, kindly send an email via this address: ${option.instructorEmail}.`,
                copyright: 'Copyright © 2024 Devon. All rights reserved.'
            }
        };
        email = mailGenerator.generate(emailForAccept);
    } else if (type === "message") {
        const emailFromContact = {
            body: {
                name: 'Devon Tutorials',
                intro: `${option.message}.`,
                outro: [`${option.name}`, `This message is from ${option.email}`],
                copyright: 'Copyright © 2024 Devon. All rights reserved.'
            }
        };
        email = mailGenerator.generate(emailFromContact);
    }

    let emailOptions = {
        from: process.env.COMPANY_EMAIL,
        to: type === "message" ? "zemonglobal@gmail.com" : option.email,
        subject: option.subject || 'Registered Successfully',
        html: email
    };

    await transporter.sendMail(emailOptions);

};

module.exports = sendEmail;
