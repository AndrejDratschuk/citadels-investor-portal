import { api } from './client';

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  messageId: string;
  message: string;
}

export const emailApi = {
  send: async (input: SendEmailInput): Promise<SendEmailResult> => {
    return api.post<SendEmailResult>('/email/send', input);
  },
};

