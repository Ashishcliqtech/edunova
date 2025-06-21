// const crypto = require('crypto');
// const config = require('./phonepeConfig');

// class PhonePeService {
//   static generatePaymentLink({ amount, transactionId, mobile, name }) {
//     const payeeVPA = '6200604080@ybl'; // your static UPI ID or dynamic if PhonePe assigned
//     const upiUrl = `upi://pay?pa=${payeeVPA}&pn=${encodeURIComponent(
//       name
//     )}&mc=0000&tid=${transactionId}&tr=${transactionId}&am=${amount}&cu=INR`;

//     return upiUrl;
//   }

//   static generateChecksum(payload) {
//     const { saltKey } = config;
//     const payloadString = JSON.stringify(payload);
//     const checksum = crypto
//       .createHmac('sha256', saltKey)
//       .update(payloadString)
//       .digest('hex');
//     return checksum;
//   }
// }

// module.exports = PhonePeService;
