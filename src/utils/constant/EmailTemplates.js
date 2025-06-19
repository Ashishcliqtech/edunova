exports.sendOtp = {
  subject: "Edunova - OTP Verification",
  text: (firstName, otp) =>
    `Dear ${firstName},\n\nYour One Time Password (OTP) is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nBest regards,\nEdunova Team`,

  html: (firstName, otp) =>
    `
      <p>Dear ${firstName},</p>
      <p>Your One Time Password (OTP) is: <strong>${otp}</strong></p>
      <p>This OTP is valid for 10 minutes.</p>
      <p>Best regards,</p>
      <p>Edunova Team</p>
    `,
};
