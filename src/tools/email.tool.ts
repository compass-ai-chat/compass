//import * as nodemailer from 'nodemailer';
import { z } from 'zod';
import { ToolHandler } from './tool.interface';
import { SimpleSchema } from '../utils/zodHelpers';

export class EmailToolService implements ToolHandler {
  async execute(params: any, config: any): Promise<any> {
    try {


        let port = config.port;
        if (!port || port === '') {
            port = 587;
        }

        let secure = config.secure;
        if (!secure || secure === '') {
            secure = false;
        }

        // const transporter = nodemailer.createTransport({
        //     host: config.host, 
        //     port: port,
        //     secure: secure, // true for 465, false for other ports
        //     auth: {
        //       user: config.user, 
        //       pass: config.password
        //     }
        //   });
      
      const mailOptions = {
        from: config.user,
        to: params.to,
        subject: params.subject,
        text: params.body
      };

      console.log("Email tool was called with params:", params);

      //await transporter.sendMail(mailOptions);
      return {
        success: true,
        message: 'Email sent successfully'
      };

    } catch (error: any) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getParamsSchema(): SimpleSchema {
    return {
      to: { type: 'string' },
      subject: { type: 'string' },
      body: { type: 'string' }
    };
  }

  getConfigSchema(): SimpleSchema {
    return {
      host: { type: 'string' },
      port: { type: 'number' },
      secure: { type: 'boolean' },
      user: { type: 'string' },
      password: { type: 'string' }
    };
  }

  getIcon(): string {
    return 'mail';
  }

  getDescription(): string {
    return 'Send an email';
  }
} 