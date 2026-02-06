import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  /**
   * Генерировать PDF отчёт о визите
   */
  async generateVisitReportPDF(visitData: any, userData: any): Promise<Buffer> {
    try {
      // Подготовить данные для шаблона
      const templateData = this.prepareTemplateData(visitData, userData);

      // Рендерить HTML из шаблона
      const html = await this.renderTemplate('visit-report', templateData);

      // Генерировать PDF
      const pdfBuffer = await this.htmlToPdf(html);

      this.logger.log(`PDF report generated for visit ${visitData.id}`);
      return pdfBuffer;
    } catch (error) {
      this.logger.error(`Failed to generate PDF for visit ${visitData.id}`, error.stack);
      throw error;
    }
  }

  /**
   * Подготовить данные для шаблона
   */
  private prepareTemplateData(visitData: any, userData: any) {
    const { car, materials, photos } = visitData;

    // Разделить фото на ДО и ПОСЛЕ
    const beforePhotos = photos
      ?.filter((p: any) => p.photoType === 'BEFORE')
      .map((p: any) => this.convertToAbsolutePath(p.photoUrl)) || [];

    const afterPhotos = photos
      ?.filter((p: any) => p.photoType === 'AFTER')
      .map((p: any) => this.convertToAbsolutePath(p.photoUrl)) || [];

    // Подсчитать итоговую стоимость материалов
    const materialsTotal = materials?.reduce((sum: number, m: any) => {
      return sum + (Number(m.quantity) * Number(m.price));
    }, 0) || 0;

    // Подготовить материалы для таблицы
    const materialsFormatted = materials?.map((m: any) => ({
      name: m.name,
      quantity: Number(m.quantity).toFixed(2),
      price: Number(m.price).toFixed(2),
      total: (Number(m.quantity) * Number(m.price)).toFixed(2),
    })) || [];

    return {
      // Информация о мастерской
      workshopLogo: userData.logoUrl ? this.convertToAbsolutePath(userData.logoUrl) : null,
      workshopName: userData.workshopName || 'Автосервис',
      workshopPhone: userData.phone || '',
      workshopAddress: userData.address || '',
      signature: userData.signatureUrl ? this.convertToAbsolutePath(userData.signatureUrl) : null,

      // Дата отчёта
      reportDate: new Date().toLocaleDateString('ru-RU'),
      visitId: visitData.id.substring(0, 8).toUpperCase(),

      // Информация об автомобиле
      carBrand: car.brand,
      carModel: car.model,
      carLicensePlate: car.licensePlate,
      carVin: car.vin || 'Не указан',
      carYear: car.year || 'Не указан',
      ownerName: car.ownerName,
      ownerPhone: car.ownerPhone,

      // Информация о визите
      visitDate: new Date(visitData.visitDate).toLocaleDateString('ru-RU'),
      workType: this.translateWorkType(visitData.workType),
      workDescription: visitData.workDescription,
      status: visitData.status,
      statusText: this.translateStatus(visitData.status),
      estimatedCompletionDate: visitData.estimatedCompletionDate
        ? new Date(visitData.estimatedCompletionDate).toLocaleDateString('ru-RU')
        : 'Не указана',

      // Чек-лист приёмки
      fuelLevel: visitData.fuelLevel !== null ? visitData.fuelLevel : 'Не указан',
      mileage: visitData.mileage !== null ? visitData.mileage : 'Не указан',
      hasDamages: visitData.hasDamages,
      damagesDescription: visitData.damagesDescription || 'Нет',
      personalItems: visitData.personalItems || 'Нет',
      tireCondition: visitData.tireCondition || 'Не указано',

      // Фото
      beforePhotos,
      afterPhotos,
      hasBeforePhotos: beforePhotos.length > 0,
      hasAfterPhotos: afterPhotos.length > 0,

      // Материалы
      materials: materialsFormatted,
      hasMaterials: materialsFormatted.length > 0,
      materialsTotal: materialsTotal.toFixed(2),

      // Стоимость
      estimatedCost: visitData.estimatedCost ? Number(visitData.estimatedCost).toFixed(2) : 'Не указана',
      finalCost: visitData.finalCost ? Number(visitData.finalCost).toFixed(2) : 'Не указана',

      // Дата генерации
      generatedAt: new Date().toLocaleString('ru-RU'),
    };
  }

  /**
   * Рендерить HTML из шаблона Handlebars
   */
  private async renderTemplate(templateName: string, data: any): Promise<string> {
    // Проверить кеш
    let template = this.templateCache.get(templateName);

    if (!template) {
      // Загрузить и скомпилировать шаблон
      const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      template = Handlebars.compile(templateContent);
      this.templateCache.set(templateName, template);
    }

    return template(data);
  }

  /**
   * Преобразовать HTML в PDF с помощью Puppeteer
   */
  private async htmlToPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Преобразовать относительный путь в абсолютный для file://
   */
  private convertToAbsolutePath(url: string): string {
    if (!url) return '';

    // Если это URL API, преобразовать в файловый путь
    if (url.startsWith('/api/files/')) {
      const relativePath = url.replace('/api/files/', '');
      const absolutePath = path.join(process.cwd(), 'uploads', relativePath);
      return `file://${absolutePath}`;
    }

    return url;
  }

  /**
   * Перевести тип работ на русский
   */
  private translateWorkType(workType: string): string {
    const translations = {
      DETAILING: 'Детейлинг',
      MAINTENANCE: 'Техническое обслуживание',
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
