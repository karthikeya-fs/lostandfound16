const nodemailer = require("nodemailer");

const sendEmail = async (toOrOptions, subject, htmlOrText) => {
  let to;
  let subjectLine;
  let html;
  let text;

  if (
    toOrOptions &&
    typeof toOrOptions === "object" &&
    !Array.isArray(toOrOptions)
  ) {
    to = toOrOptions.to;
    subjectLine = toOrOptions.subject;
    text = toOrOptions.text;
    html = toOrOptions.html || (text ? `<p>${text}</p>` : undefined);
  } else {
    to = toOrOptions;
    subjectLine = subject;
    html = htmlOrText;
  }

  if (!to || !subjectLine) {
    throw new Error("Email requires to and subject");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: subjectLine,
    html: html || `<p>${text || ""}</p>`,
    text: text || undefined,
  });
};

module.exports = sendEmail;
