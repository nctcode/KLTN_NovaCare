import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeviceTokenService } from './device-token.service';
import * as fs from 'fs';

let initializeApp: any = null;
let cert: any = null;
let getMessaging: any = null;
try {
  const admin = require('firebase-admin');
  initializeApp = admin.initializeApp;
  cert = admin.credential?.cert;
  getMessaging = admin.messaging;
} catch {
  // firebase-admin fallback
}

@Injectable()
export class FcmService {
  private logger = new Logger(FcmService.name);
  private isInitialized = false;

  constructor(
    private configService: ConfigService,
    private deviceTokenService: DeviceTokenService,
  ) {
    this.initFirebase();
  }

  private initFirebase() {
    try {
      const credPath = this.configService.get<string>('FCM_CREDENTIALS_PATH');
      if (credPath && fs.existsSync(credPath) && initializeApp && cert) {
        initializeApp({
          credential: cert(credPath),
        });
        this.isInitialized = true;
        this.logger.log('Firebase Admin SDK initialized successfully');
      } else {
        this.logger.warn('FCM credentials path not found or empty. FCM Push Notifications will be simulated.');
      }
    } catch (e: any) {
      this.logger.error(`Firebase initialization error: ${e.message}`);
    }
  }

  async sendPushNotification(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<boolean> {
    if (!tokens || tokens.length === 0) return false;

    if (!this.isInitialized || !getMessaging) {
      this.logger.log(`[FCM Push Simulated] Title: "${title}" | Body: "${body}" | Tokens: ${tokens.length}`);
      return true;
    }

    try {
      const message: any = {
        tokens,
        notification: { title, body },
        data: data || {},
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      };

      const response = await getMessaging().sendEachForMulticast(message);
      this.logger.log(`FCM multicast sent: ${response.successCount} success, ${response.failureCount} failed.`);

      response.responses.forEach((res: any, idx: number) => {
        if (!res.success && res.error) {
          const token = tokens[idx];
          if (
            res.error.code === 'messaging/invalid-registration-token' ||
            res.error.code === 'messaging/registration-token-not-registered'
          ) {
            this.deviceTokenService.deactivateToken(token);
          }
        }
      });

      return response.successCount > 0;
    } catch (error: any) {
      this.logger.error(`Error sending FCM push: ${error.message}`);
      return false;
    }
  }
}
