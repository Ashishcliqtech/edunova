const sgMail = require("@sendgrid/mail");
const { InternalServerError } = require("http-errors"); // or use your custom error
const logger = require("../logger");
const EmailTemplates = require('../constant/EmailTemplates');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class SendGridService {
  constructor() {
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || "no-reply@academix.com";
  }

  async sendMail(to, subject, text, html) {
    const msg = {
      to,
      from: this.fromEmail,
      subject,
      text,
      html,
    };

    try {
      await sgMail.send(msg);
      logger.info(`✅ Email sent to ${to}`);
    } catch (error) {
      logger.error(`❌ Error sending email to ${to}: ${error.message}`);
      if (error.response) {
        logger.error(
          `SendGrid Response Error: ${JSON.stringify(error.response.body)}`
        );
      }
      throw new InternalServerError(`Error sending email to ${to}`);
    }
  }

  async sendOtp(userName, email, otp) {
    const subject = "Edunova - OTP Verification";
    const text = EmailTemplates.sendOtp.text(userName, otp);
    const html = EmailTemplates.sendOtp.html(userName, otp);
    await this.sendMail(email, subject, text, html);
  }
}

module.exports = new SendGridService();
