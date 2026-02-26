import {
    Controller,
    Get,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
} from '@nestjs/swagger';
import {SettingsService} from "./settings.service";

@ApiTags('Settings')
@ApiBearerAuth('JWT-auth')
@Controller('settings')
export class SettingsController {
    constructor(
        private readonly settingsService: SettingsService,
    ) {}

    /**
     * GET /api/settings - Получить настройки приложения
     */
    @Get()
    async getSettings(
    ) {
        return this.settingsService.getSettings();
    }
}
