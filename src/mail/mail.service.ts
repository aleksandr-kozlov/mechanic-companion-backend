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

  /**
   * Отправить отчёт о визите на email
   */
  async sendVisitReportEmail(
    email: string,
    visitData: any,
    pdfBuffer: Buffer,
  ) {
    try {
      const { car, visitDate, workType, status } = visitData;

      await this.mailerService.sendMail({
        to: email,
        subject: `Отчёт о визите - ${car.brand} ${car.model} (${car.licensePlate})`,
        template: 'visit-report',
        context: {
          carBrand: car.brand,
          carModel: car.model,
          licensePlate: car.licensePlate,
          visitDate: new Date(visitDate).toLocaleDateString('ru-RU'),
          workType: this.translateWorkType(workType),
          status: this.translateStatus(status),
        },
        attachments: [
          {
            filename: `visit-report-${car.licensePlate}-${new Date(visitDate).toISOString().split('T')[0]}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      this.logger.log(`Visit report email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send visit report email to ${email}`, error.stack);
      throw error; // Бросаем ошибку, так как это критично для пользователя
    }
  }

  /**
   * Перевести тип работ на русский
   */
  private translateWorkType(workType: string): string {
    const translations = {
      DETAILING: 'Детейлинг',
      MAINTENANCE: 'Техобслуживание',
      REPAIR: 'Ремонт',
      DIAGNOSTICS: 'Диагностика',
      TIRE_SERVICE: 'Шиномонтаж',
      OTHER: 'Другое',
    };
    return translations[workType] || workType;
  }

  /**
   * Перевести статус на русский
   */
  private translateStatus(status: string): string {
    const translations = {
      IN_PROGRESS: 'В работе',
      COMPLETED: 'Завершено',
      DELIVERED: 'Выдано',
      CANCELLED: 'Отменено',
    };
    return translations[status] || status;
  }
}
