export type userAccountParams = {
  email: string;
  password: string;
  userAgent?: string;
};

export type ResetPasswordParams = {
    password: string;
    verificationCode: string;
  };