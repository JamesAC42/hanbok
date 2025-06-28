const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, verificationUrl, username) => {
    try {
        // Check if email is enabled
        if (process.env.EMAIL_ENABLED !== 'true') {
            // For development, just log the verification details
            console.log('='.repeat(60));
            console.log('📧 VERIFICATION EMAIL (Development Mode)');
            console.log('='.repeat(60));
            console.log(`To: ${email}`);
            console.log(`Username: ${username}`);
            console.log(`Verification URL: ${verificationUrl}`);
            console.log('='.repeat(60));
            return { success: true };
        }

        // Create transporter for privateemail (Namecheap)
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST, // Usually mail.privateemail.com
            port: parseInt(process.env.EMAIL_PORT) || 587, // 587 for TLS, 465 for SSL
            secure: process.env.EMAIL_SECURE === 'true', // true for SSL (port 465), false for TLS (port 587)
            auth: {
                user: process.env.EMAIL_USER, // Your full email: admin@hanbokstudy.com
                pass: process.env.EMAIL_PASS  // Your email password
            },
            tls: {
                // Don't fail on invalid certs for privateemail
                rejectUnauthorized: false
            }
        });

        // Verify connection configuration
        await transporter.verify();

        const mailOptions = {
            from: `"Hanbok Study" <${process.env.EMAIL_USER}>`, // sender address
            to: email, // recipient
            subject: 'Verify your Hanbok Study account',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Verify your Hanbok Study account</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Hanbok Study!</h1>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
                        <h2 style="color: #1e293b; margin-top: 0;">Hello ${username}!</h2>
                        
                        <p style="font-size: 16px; margin-bottom: 25px;">
                            Thank you for creating an account with Hanbok Study. To get started, please verify your email address by clicking the button below:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationUrl}" 
                               style="background-color: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                                Verify Email Address
                            </a>
                        </div>
                        
                        <p style="font-size: 14px; color: #64748b; margin-top: 25px;">
                            If the button doesn't work, you can also copy and paste this link into your browser:
                        </p>
                        <p style="word-break: break-all; background: #e2e8f0; padding: 10px; border-radius: 4px; font-size: 14px;">
                            ${verificationUrl}
                        </p>
                        
                        <hr style="border: 1px solid #e2e8f0; margin: 25px 0;">
                        
                        <p style="font-size: 14px; color: #64748b;">
                            If you didn't create this account, you can safely ignore this email.
                        </p>
                        
                        <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
                            Best regards,<br>
                            <strong>The Hanbok Study Team</strong>
                        </p>
                    </div>
                </body>
                </html>
            `
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent successfully:', info.messageId);
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending verification email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendVerificationEmail
}; 