export function apiToPrisma(level) {
    switch (level) {
        case '3':
            return 'three';
        case '4':
            return 'four';
        case '5':
            return 'five';
        default:
            return 'deluxe';
    }
}
export function prismaToApi(level) {
    switch (level) {
        case 'three':
            return '3';
        case 'four':
            return '4';
        case 'five':
            return '5';
        default:
            return 'deluxe';
    }
}
