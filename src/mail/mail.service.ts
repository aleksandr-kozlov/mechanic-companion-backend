import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  /**
   * Отправить email для восстановления пароля
   */
  async sendPasswordResetEmail(email: string, resetToken: string) {
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8081';

    // Ссылка для сброса пароля (на фронтенд приложение)
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Восстановление пароля - MechanicCompanion',
        template: 'password-reset',
        context: {
          resetLink,
          email,
        },
      });

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error.stack);
      // Не бросаем ошибку, чтобы не ломать основной флоу
      // В реальном приложении можно добавить retry механизм
    }
  }

}
