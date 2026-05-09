export type ApiAccommodation = '3' | '4' | '5' | 'deluxe';
export type PrismaAccommodation = 'three' | 'four' | 'five' | 'deluxe';

export function apiToPrisma(level: ApiAccommodation): PrismaAccommodation {
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

export function prismaToApi(level: PrismaAccommodation): ApiAccommodation {
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


