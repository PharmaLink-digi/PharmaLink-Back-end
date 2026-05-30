import * as clientDB from "../../database/dbclient.js";
import nodemailer from "nodemailer";

// Basic login logic validating email/password
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await clientDB.getClientByEmail(email);
        
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Simplistic password check (assuming plain text per previous setup)
        // In a real production app, use bcrypt.compare
        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.status(200).json({ message: "Login successful", user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Send welcome email via Nodemailer
export const sendWelcomeEmail = async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email || !name) {
            return res.status(400).json({ message: "Email and name are required" });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail', // Standard fallback, adjust if using custom SMTP
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Welcome to PharmaLink!',
            html: `<h3>Hello ${name},</h3><p>Welcome to PharmaLink. We're glad to have you!</p>`
        };

        await transporter.sendMail(mailOptions);
        
        res.status(200).json({ message: "Welcome email sent successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
