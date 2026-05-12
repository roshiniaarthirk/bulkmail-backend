const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

require("dotenv").config();

const app = express();

/* Middleware */

app.use(cors());

app.use(express.json());

/* MongoDB Connection */

mongoose.connect(process.env.MONGO_URL, {
    family: 4
})

.then(() => {

    console.log("Connected to MongoDB");

})

.catch((err) => {

    console.log("MongoDB Error:", err);

});

/* Mail Schema */

const mailSchema = new mongoose.Schema({

    subject: String,

    message: String,

    recipients: Array,

    status: String,

}, { timestamps: true });

const Mail = mongoose.model("Mail", mailSchema);

/* Nodemailer Transporter */

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {

        user: process.env.EMAIL,

        pass: process.env.PASSWORD,

    },

});

/* Email Template */

const emailTemplate = (subject, message, recipient) => ({

    from: process.env.EMAIL,

    to: recipient,

    subject: subject,

    text: message,

});

/* Send Multiple Emails */

const sendMails = ({ subject, message, emailList }) => {

    return new Promise(async (resolve, reject) => {

        try {

            for (const recipient of emailList) {

                const mailOptions = emailTemplate(
                    subject,
                    message,
                    recipient
                );

                await transporter.sendMail(mailOptions);

                console.log(`Email sent to ${recipient}`);

            }

            resolve("Success");

        } catch (error) {

            console.error("Error sending emails:", error.message);

            reject(error.message);

        }

    });

};

/* Send Mail API */

app.post("/sendmail", async function (req, res) {

    try {

        await sendMails(req.body);

        const newMail = new Mail({

            subject: req.body.subject,

            message: req.body.message,

            recipients: req.body.emailList,

            status: "Sent",

        });

        await newMail.save();

        res.send("Mail Sent Successfully");

    } catch (error) {

        console.log(error);

        res.send("Error Sending Mail");

    }

});

/* History API */

app.get("/history", async function (req, res) {

    try {

        const mails = await Mail.find().sort({ createdAt: -1 });

        res.json(mails);

    } catch (error) {

        res.status(500).json({
            message: "Error Fetching History"
        });

    }

});

/* Server */

app.listen(5000, function () {

    console.log("Server Started on Port 5000");

});