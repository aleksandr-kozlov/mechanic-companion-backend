import {Injectable} from "@nestjs/common";

@Injectable()
export class SettingsService {
    async getSettings() {
        return {
            bundle
        }
    }
}

const bundle = {
    required: true,
    actualJsVersion: '1.149.14',
    link: 'https://alpha.newton-technology.ru/bundles/alpha/alpha.org.profitum.profitum/ios/1.148.1/6590-1770285159-main.jsbundle',
    checksum: '70dab63c613b95dc76fd7a1c99bc7fe3148599ba820fdfadbfd14b4718e05193',
};
