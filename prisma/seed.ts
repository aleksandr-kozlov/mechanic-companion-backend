import { PrismaClient, WorkType, VisitStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных демо-данными...');

  // ─── Пользователь ────────────────────────────────────────────────────────────

  const hashedPassword = await bcrypt.hash('demo1234', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@mechanic.ru' },
    update: {},
    create: {
      email: 'demo@mechanic.ru',
      password: hashedPassword,
      workshopName: 'СТО "Автомастер"',
      phone: '+7 (495) 123-45-67',
      address: 'г. Москва, ул. Автозаводская, 15',
    },
  });

  console.log(`✅ Пользователь: ${user.email}`);

  // ─── Машины ──────────────────────────────────────────────────────────────────

  const carData = [
    {
      licensePlate: 'А123ВС77',
      brand: 'Toyota',
      model: 'Camry',
      year: 2020,
      vin: 'JTDBR32E630114721',
      ownerName: 'Александр Петров',
      ownerPhone: '+7 (916) 234-56-78',
      ownerEmail: 'petrov.alex@mail.ru',
      notes: 'Постоянный клиент. Предпочитает оригинальные запчасти.',
    },
    {
      licensePlate: 'В456МА99',
      brand: 'BMW',
      model: '520d F10',
      year: 2018,
      vin: 'WBA5A71000G123456',
      ownerName: 'Мария Иванова',
      ownerPhone: '+7 (926) 345-67-89',
      ownerEmail: 'ivanova.maria@gmail.com',
      notes: null,
    },
    {
      licensePlate: 'С789КО197',
      brand: 'Lada',
      model: 'Vesta',
      year: 2022,
      vin: 'XTAGF145AL0123456',
      ownerName: 'Иван Сидоров',
      ownerPhone: '+7 (903) 456-78-90',
      ownerEmail: null,
      notes: 'Гарантийный случай — требует документальное оформление.',
    },
    {
      licensePlate: 'Е321НО78',
      brand: 'Kia',
      model: 'Sportage IV',
      year: 2021,
      vin: 'U5YHM81ADML123456',
      ownerName: 'Елена Козлова',
      ownerPhone: '+7 (985) 567-89-01',
      ownerEmail: 'kozlova.e@yandex.ru',
      notes: null,
    },
    {
      licensePlate: 'М654ТР177',
      brand: 'Mercedes-Benz',
      model: 'C200 W205',
      year: 2019,
      vin: 'WDD2050321R123456',
      ownerName: 'Сергей Волков',
      ownerPhone: '+7 (967) 678-90-12',
      ownerEmail: 'volkov.s@mail.ru',
      notes: 'VIP-клиент. Только сертифицированные детали.',
    },
  ];

  const cars: Record<string, string> = {}; // licensePlate → id

  for (const data of carData) {
    const car = await prisma.car.upsert({
      where: { userId_licensePlate: { userId: user.id, licensePlate: data.licensePlate } },
      update: {},
      create: { userId: user.id, ...data },
    });
    cars[data.licensePlate] = car.id;
    console.log(`  🚗 ${data.brand} ${data.model} [${data.licensePlate}]`);
  }

  // ─── Визиты ──────────────────────────────────────────────────────────────────

  type VisitInput = {
    carId: string;
    visitDate: Date;
    workType: WorkType;
    workDescription: string;
    estimatedCost?: number;
    finalCost?: number;
    estimatedCompletionDate?: Date;
    status: VisitStatus;
    fuelLevel?: number;
    mileage?: number;
    hasDamages?: boolean;
    damagesDescription?: string;
    personalItems?: string;
    tireCondition?: string;
    materials: { name: string; quantity: number; price: number }[];
  };

  const visitsData: VisitInput[] = [
    // ── Toyota Camry ──────────────────────────────────────────────────────────
    {
      carId: cars['А123ВС77'],
      visitDate: new Date('2025-12-10'),
      workType: WorkType.DETAILING,
      workDescription:
        'Полная химчистка салона: сиденья, ковры, потолок. Полировка кузова в 2 этапа с нанесением защитного керамического покрытия.',
      estimatedCost: 18000,
      finalCost: 17500,
      estimatedCompletionDate: new Date('2025-12-11'),
      status: VisitStatus.DELIVERED,
      fuelLevel: 70,
      mileage: 62300,
      hasDamages: false,
      tireCondition: 'Зимняя резина, состояние хорошее',
      personalItems: 'Детское кресло в багажнике',
      materials: [
        { name: 'Шампунь для химчистки Meguiar\'s', quantity: 0.5, price: 1200 },
        { name: 'Кондиционер для кожи', quantity: 1, price: 850 },
        { name: 'Керамическое покрытие Gyeon Q²', quantity: 1, price: 7500 },
        { name: 'Полировальная паста Koch Chemie', quantity: 0.3, price: 950 },
      ],
    },
    {
      carId: cars['А123ВС77'],
      visitDate: new Date('2026-02-03'),
      workType: WorkType.MAINTENANCE,
      workDescription:
        'Плановое ТО-60000 км: замена масла, фильтров (масляного, воздушного, салонного). Проверка тормозной системы, ходовой части. Диагностика электрики.',
      estimatedCost: 12000,
      finalCost: 13500,
      estimatedCompletionDate: new Date('2026-02-03'),
      status: VisitStatus.DELIVERED,
      fuelLevel: 40,
      mileage: 68100,
      hasDamages: false,
      tireCondition: 'Зимняя резина, протектор 5 мм',
      materials: [
        { name: 'Масло моторное Mobil 5W-30', quantity: 5, price: 650 },
        { name: 'Фильтр масляный Toyota', quantity: 1, price: 380 },
        { name: 'Фильтр воздушный Toyota', quantity: 1, price: 520 },
        { name: 'Фильтр салонный Toyota', quantity: 1, price: 460 },
        { name: 'Жидкость тормозная DOT 4', quantity: 0.5, price: 280 },
      ],
    },
    {
      carId: cars['А123ВС77'],
      visitDate: new Date('2026-03-08'),
      workType: WorkType.TIRE_SERVICE,
      workDescription:
        'Сезонная смена шин (зима → лето). Балансировка всех 4 колёс. Проверка и подкачка давления. Хранение зимних шин.',
      estimatedCost: 4000,
      estimatedCompletionDate: new Date('2026-03-08'),
      status: VisitStatus.IN_PROGRESS,
      fuelLevel: 55,
      mileage: 69800,
      hasDamages: false,
      tireCondition: 'Летняя резина Michelin Primacy 4, новые',
      materials: [
        { name: 'Грузики балансировочные', quantity: 8, price: 15 },
        { name: 'Вентили резиновые', quantity: 4, price: 25 },
      ],
    },

    // ── BMW 520d ──────────────────────────────────────────────────────────────
    {
      carId: cars['В456МА99'],
      visitDate: new Date('2026-01-15'),
      workType: WorkType.REPAIR,
      workDescription:
        'Замена передних тормозных колодок и дисков. Прокачка тормозной системы. Клиент жаловался на вибрацию при торможении.',
      estimatedCost: 22000,
      finalCost: 24800,
      estimatedCompletionDate: new Date('2026-01-16'),
      status: VisitStatus.DELIVERED,
      fuelLevel: 30,
      mileage: 115400,
      hasDamages: true,
      damagesDescription: 'Царапина на переднем бампере справа (существующая, зафиксирована при приёмке)',
      tireCondition: 'Зимняя резина Continental, остаток протектора 4 мм',
      materials: [
        { name: 'Колодки тормозные передние Brembo', quantity: 1, price: 4200 },
        { name: 'Диски тормозные передние BMW OEM (2 шт)', quantity: 2, price: 7800 },
        { name: 'Жидкость тормозная Castrol DOT 4', quantity: 1, price: 450 },
        { name: 'Смазка для направляющих суппорта', quantity: 1, price: 350 },
      ],
    },
    {
      carId: cars['В456МА99'],
      visitDate: new Date('2026-03-05'),
      workType: WorkType.DIAGNOSTICS,
      workDescription:
        'Компьютерная диагностика: загорелся Check Engine. Считывание кодов ошибок. Предварительный вывод — неисправность датчика кислорода (лямбда-зонда). Требуется согласование замены.',
      estimatedCost: 3500,
      estimatedCompletionDate: new Date('2026-03-06'),
      status: VisitStatus.COMPLETED,
      fuelLevel: 60,
      mileage: 118200,
      hasDamages: true,
      damagesDescription: 'Царапина на переднем бампере справа (зафиксирована ранее)',
      tireCondition: 'Зимняя резина, протектор 3.5 мм',
      materials: [
        { name: 'Диагностика (комп. сканер)', quantity: 1, price: 1500 },
      ],
    },

    // ── Lada Vesta ────────────────────────────────────────────────────────────
    {
      carId: cars['С789КО197'],
      visitDate: new Date('2025-11-22'),
      workType: WorkType.MAINTENANCE,
      workDescription:
        'ТО-30000 км: замена масла и масляного фильтра, проверка уровней жидкостей, диагностика ходовой. Замена воздушного фильтра.',
      estimatedCost: 6000,
      finalCost: 5800,
      estimatedCompletionDate: new Date('2025-11-22'),
      status: VisitStatus.DELIVERED,
      fuelLevel: 80,
      mileage: 30200,
      hasDamages: false,
      tireCondition: 'Зимняя резина Yokohama, новая',
      materials: [
        { name: 'Масло моторное Lada 5W-40', quantity: 3.5, price: 420 },
        { name: 'Фильтр масляный Lada', quantity: 1, price: 180 },
        { name: 'Фильтр воздушный Lada', quantity: 1, price: 220 },
        { name: 'Антифриз G12+ (долив)', quantity: 0.5, price: 150 },
      ],
    },
    {
      carId: cars['С789КО197'],
      visitDate: new Date('2026-02-18'),
      workType: WorkType.REPAIR,
      workDescription:
        'Замена переднего левого амортизатора и опорного подшипника. Стук в подвеске при проезде неровностей.',
      estimatedCost: 8500,
      finalCost: 8500,
      estimatedCompletionDate: new Date('2026-02-19'),
      status: VisitStatus.DELIVERED,
      fuelLevel: 50,
      mileage: 33600,
      hasDamages: false,
      tireCondition: 'Зимняя резина, протектор 7 мм',
      materials: [
        { name: 'Амортизатор передний левый LADA оригинал', quantity: 1, price: 3200 },
        { name: 'Опорный подшипник', quantity: 1, price: 850 },
        { name: 'Пыльник амортизатора', quantity: 1, price: 320 },
        { name: 'Буфер хода сжатия', quantity: 1, price: 180 },
      ],
    },

    // ── Kia Sportage ──────────────────────────────────────────────────────────
    {
      carId: cars['Е321НО78'],
      visitDate: new Date('2026-03-09'),
      workType: WorkType.DETAILING,
      workDescription:
        'Полировка кузова (удаление мелких царапин). Антидождь на стёкла. Чернение пластика. Нанесение воска на кузов.',
      estimatedCost: 9000,
      estimatedCompletionDate: new Date('2026-03-10'),
      status: VisitStatus.IN_PROGRESS,
      fuelLevel: 65,
      mileage: 42500,
      hasDamages: false,
      tireCondition: 'Зимняя резина Bridgestone, протектор 6 мм',
      personalItems: 'Видеорегистратор, зарядное устройство в бардачке',
      materials: [
        { name: 'Полировальная паста 3M Ultrafina', quantity: 0.2, price: 1800 },
        { name: 'Антидождь Rain-X', quantity: 1, price: 550 },
        { name: 'Чернитель пластика', quantity: 1, price: 380 },
        { name: 'Воск Meguiar\'s Gold Class', quantity: 1, price: 1200 },
      ],
    },

    // ── Mercedes-Benz C200 ────────────────────────────────────────────────────
    {
      carId: cars['М654ТР177'],
      visitDate: new Date('2026-02-25'),
      workType: WorkType.REPAIR,
      workDescription:
        'Замена рулевой рейки. Клиент отказался от ремонта после согласования стоимости работ. Автомобиль выдан клиенту.',
      estimatedCost: 85000,
      estimatedCompletionDate: new Date('2026-02-28'),
      status: VisitStatus.CANCELLED,
      fuelLevel: 90,
      mileage: 78300,
      hasDamages: false,
      tireCondition: 'Зимняя резина Pirelli SottoZero, протектор 5 мм',
      materials: [],
    },
  ];

  console.log('\n📋 Создание визитов...');

  for (const visitInput of visitsData) {
    const { materials, ...visitFields } = visitInput;

    await prisma.visit.create({
      data: {
        ...visitFields,
        estimatedCost: visitFields.estimatedCost ?? undefined,
        finalCost: visitFields.finalCost ?? undefined,
        materials: {
          create: materials.map((m) => ({
            name: m.name,
            quantity: m.quantity,
            price: m.price,
          })),
        },
      },
    });
  }

  // ─── Обновить счётчики машин ──────────────────────────────────────────────

  for (const [licensePlate, carId] of Object.entries(cars)) {
    const visits = await prisma.visit.findMany({
      where: { carId, status: { not: VisitStatus.CANCELLED } },
      orderBy: { visitDate: 'desc' },
    });

    await prisma.car.update({
      where: { id: carId },
      data: {
        visitsCount: visits.length,
        lastVisitDate: visits.length > 0 ? visits[0].visitDate : null,
      },
    });
    console.log(`  📊 Обновлён счётчик: [${licensePlate}] — ${visits.length} визит(ов)`);
  }

  // ─── Итог ─────────────────────────────────────────────────────────────────

  const totalVisits = await prisma.visit.count();
  const totalMaterials = await prisma.visitMaterial.count();

  console.log('\n✅ База данных заполнена:');
  console.log(`   👤 Пользователей: 1  (demo@mechanic.ru / demo1234)`);
  console.log(`   🚗 Машин:         ${Object.keys(cars).length}`);
  console.log(`   📋 Визитов:       ${totalVisits}`);
  console.log(`   🔩 Материалов:    ${totalMaterials}`);
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении БД:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
