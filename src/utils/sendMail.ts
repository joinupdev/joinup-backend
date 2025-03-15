import resend from "../config/resend";
import { EMAIL_SENDER, NODE_ENV } from "../constants/env";

type Params = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const getFromEmail = () => 
    NODE_ENV === "production" ? EMAIL_SENDER : "onboarding@resend.dev";

const getToEmail = (to: string) =>
    NODE_ENV === "production" ? to : "joinup.main@gmail.com";


export const sendMail = async ({ to, subject, text, html }: Params) => {
    console.log(EMAIL_SENDER)
    return await resend.emails.send({
        from: `JoinUp <${EMAIL_SENDER}>`,
        to: "test-2s984p933@srv1.mail-tester.com",
        subject,
        text,
        html
    })
};
