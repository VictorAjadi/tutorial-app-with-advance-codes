const asyncErrorHandler = require("./asyncErrorHandler");
const sendEmail = require("../config/email");

exports.sendContactMail= asyncErrorHandler(async function(req,res,next){
    const {mail,name,email}= req.body;
    if(!mail || !name || !email){
        return res.status(400).json({
            status: 'error',
            message: "Please enter all fields, below..."
        });
    }
    const sendEmailWithRetry = async (options, retries = 3) => {
        for (let i = 0; i < retries; i++) {
            try {
                await sendEmail(options, "message");
                return res.status(200).json({
                    status: "success",
                    message: "Mail successfullly sent!"
                  })
            } catch (error) {
                if (i === retries - 1)
                    return res.status(400).json({
                        status: 'error',
                        message: "Failed to send email due to bad network connection..."
                    });
            }
        }
    };
    await sendEmailWithRetry({
        email,
        name,
        message: mail,
        link: `${req.protocol}://${req.get("host")}/`,
        subject: "Mail message from user"
    })
});

