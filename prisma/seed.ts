import { PrismaClient, RoleType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Durian Hub database seeding...");

  // 1. Durian Varieties
  const varieties = [
    { nameTh: "หมอนทอง", nameEn: "Monthong", iconEmoji: "🍈", description: "เนื้อหนา ละเอียด เมล็ดลีบ กลิ่นไม่แรง ยอดนิยมอันดับ 1 ในการส่งออก" },
    { nameTh: "ชะนี", nameEn: "Chanee", iconEmoji: "🍈", description: "เนื้อเหนียวละเอียด สีเหลืองจัด รสชาติหวานมันจัด กลิ่นหอมแรง" },
    { nameTh: "ก้านยาว", nameEn: "Kanyao", iconEmoji: "🍈", description: "ทุเรียนพันธุ์โบราณพรีเมียม ก้านยาวสมชื่อ เนื้อเนียนละเอียด กลิ่นหอมละมุน" },
    { nameTh: "นกกระจิบ", nameEn: "Nokkrajib", iconEmoji: "🍈", description: "พันธุ์เบา สุกเร็ว รสหวานมัน ออกก่อนฤดูพันธุ์อื่น" },
    { nameTh: "พวงมณี", nameEn: "Puangmanee", iconEmoji: "🍈", description: "ผลขนาดกะทัดรัด เนื้อสีส้มเข้ม หวานจัด เหนียวอร่อย" },
    { nameTh: "ภูเขาไฟ", nameEn: "Volcano Durian", iconEmoji: "🌋", description: "ทุเรียนดินภูเขาไฟศรีสะเกษ กรอบนอกนุ่มใน ละมุน ไม่ฉุน" },
  ];

  for (const v of varieties) {
    await prisma.durianVariety.upsert({
      where: { nameTh: v.nameTh },
      update: {},
      create: v,
    });
  }
  console.log("✅ Seeded Durian Varieties");

  // 2. Durian Grades
  const grades = [
    { gradeCode: "AB_EXPORT", nameTh: "เกรด AB (ส่งออก)", description: "ทุเรียน 4-5 พูเต็ม รูปทรงสวย น้ำหนัก 2.5 - 4.5 กก. เปอร์เซ็นต์แป้งมาตรฐาน" },
    { gradeCode: "C_GRADE", nameTh: "เกรด C (ในประเทศ)", description: "รูปทรงมาตรฐาน 3 พูเต็ม รสชาติหวานมัน บริโภคในประเทศ" },
    { gradeCode: "OUT_SIZE", nameTh: "เกรดตกไซซ์ / ผิวลาย", description: "ลูกเล็กกว่า 2 กก. หรือใหญ่เกินไป หรือผิวลาย แต่เนื้อสุกพร้อมทาน" },
    { gradeCode: "ORCHARD_LUMP", nameTh: "เหมาแปลง / เหมาสวน", description: "เหมาตัดทั้งต้น/ทั้งแปลง ไม่คัดเกรด เหมาะสำหรับล้งเหมาสวน" },
  ];

  for (const g of grades) {
    await prisma.durianGrade.upsert({
      where: { gradeCode: g.gradeCode },
      update: {},
      create: g,
    });
  }
  console.log("✅ Seeded Durian Grades");

  // 3. Regional Seasons
  const regions = [
    {
      regionCode: "EAST",
      regionName: "ภาคตะวันออก",
      provincesSummary: "จันทบุรี, ระยอง, ตราด",
      popularVarieties: "หมอนทอง, ชะนี, กระดุมทอง, พวงมณี",
      harvestPeriod: "มี.ค. - มิ.ย.",
      highlightNote: "แหล่งผลิตทุเรียนส่งออกหลักอันดับ 1 ของไทย ช่วงผลผลิตชุกที่สุดคือปลาย เม.ย. - พ.ค.",
    },
    {
      regionCode: "SOUTH",
      regionName: "ภาคใต้ตอนบน",
      provincesSummary: "ชุมพร, สุราษฎร์ธานี, นครศรีธรรมราช",
      popularVarieties: "หมอนทอง, ก้านยาว",
      harvestPeriod: "ก.ค. - ก.ย.",
      highlightNote: "ฤดูกาลถัดจากภาคตะวันออก ผลผลิตออกสู่ตลาดช่วงไตรมาสที่ 3",
    },
    {
      regionCode: "DEEP_SOUTH",
      regionName: "3 จังหวัดชายแดนใต้",
      provincesSummary: "ยะลา, ปัตตานี, นราธิวาส",
      popularVarieties: "หมอนทอง (ทุเรียนสะเด็ดน้ำยะลา)",
      harvestPeriod: "ส.ค. - ต.ค.",
      highlightNote: "ทุเรียนสะเด็ดน้ำยะลา ปลูกบนพื้นที่สูง เนื้อแห้งเนียน รสชาติหวานมันเอกลักษณ์",
    },
    {
      regionCode: "ISAN",
      regionName: "ภาคอีสาน",
      provincesSummary: "ศรีสะเกษ, นครราชสีมา",
      popularVarieties: "ทุเรียนภูเขาไฟศรีสะเกษ (GI)",
      harvestPeriod: "มิ.ย. - ก.ค.",
      highlightNote: "ปลูกบนดินภูเขาไฟโบราณ เนื้อสัมผัสเนียนนุ่ม แห้ง ไม่แฉะติดมือ",
    },
    {
      regionCode: "NORTH",
      regionName: "ภาคเหนือ",
      provincesSummary: "อุตรดิตถ์, เชียงใหม่",
      popularVarieties: "หลงลับแล, หลินลับแล, หมอนทอง",
      harvestPeriod: "พ.ค. - ส.ค.",
      highlightNote: "ทุเรียนเมืองลับแล ปลูกตามไหล่เขา ผลขนาดเล็ก เนื้อเนียน ละเอียด กลิ่นหอมเฉพาะตัว",
    },
    {
      regionCode: "CENTRAL",
      regionName: "ภาคกลาง",
      provincesSummary: "นนทบุรี, ปราจีนบุรี",
      popularVarieties: "ก้านยาวนนทบุรี, หมอนทองปราจีน (GI)",
      harvestPeriod: "เม.ย. - พ.ค.",
      highlightNote: "ทุเรียนเกรดพรีเมียม รสชาติประณีต ดินตะกอนแม่น้ำอุดมสมบูรณ์",
    },
  ];

  for (const r of regions) {
    await prisma.regionalSeason.upsert({
      where: { regionCode: r.regionCode },
      update: {},
      create: r,
    });
  }
  console.log("✅ Seeded Regional Seasons");

  // 4. Default Locations
  const eastSeason = await prisma.regionalSeason.findUnique({ where: { regionCode: "EAST" } });
  const southSeason = await prisma.regionalSeason.findUnique({ where: { regionCode: "SOUTH" } });
  const deepSouthSeason = await prisma.regionalSeason.findUnique({ where: { regionCode: "DEEP_SOUTH" } });

  const locations = [
    { province: "จันทบุรี", district: "มะขาม", region: "ภาคตะวันออก", regionalSeasonId: eastSeason?.id },
    { province: "ระยอง", district: "แกลง", region: "ภาคตะวันออก", regionalSeasonId: eastSeason?.id },
    { province: "ตราด", district: "เขาสมิง", region: "ภาคตะวันออก", regionalSeasonId: eastSeason?.id },
    { province: "ชุมพร", district: "หลังสวน", region: "ภาคใต้", regionalSeasonId: southSeason?.id },
    { province: "ยะลา", district: "เมือง", region: "3 จังหวัดชายแดนใต้", regionalSeasonId: deepSouthSeason?.id },
    { province: "ปัตตานี", district: "เมือง", region: "3 จังหวัดชายแดนใต้", regionalSeasonId: deepSouthSeason?.id },
    { province: "นราธิวาส", district: "เมือง", region: "3 จังหวัดชายแดนใต้", regionalSeasonId: deepSouthSeason?.id },
    { province: "กรุงเทพฯ", district: "พระนคร", region: "ภาคกลาง" },
  ];

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { province_district: { province: loc.province, district: loc.district } },
      update: {},
      create: loc,
    });
  }
  console.log("✅ Seeded Locations");

  // 5. Default Test Users with Password: password123
  const defaultPasswordHash = await bcrypt.hash("password123", 10);
  const chanLoc = await prisma.location.findFirst({ where: { province: "จันทบุรี" } });
  const rayongLoc = await prisma.location.findFirst({ where: { province: "ระยอง" } });
  const chumphonLoc = await prisma.location.findFirst({ where: { province: "ชุมพร" } });
  const bkkLoc = await prisma.location.findFirst({ where: { province: "กรุงเทพฯ" } });

  const testUsers = [
    {
      email: "seller@durian.com",
      phone: "089-456-7890",
      fullName: "คุณสมชาย ชาวสวนจันท์",
      activeRole: "SELLER" as RoleType,
      businessName: "สวนสมชาย จันทบุรี (GAP Certified)",
      locationId: chanLoc?.id,
      trustScore: 100,
      ratingAvg: 5.0,
    },
    {
      email: "buyer@durian.com",
      phone: "081-999-8888",
      fullName: "เฮียชัย โกดังรับซื้อ",
      activeRole: "BUYER" as RoleType,
      businessName: "ล้งเจริญผล อินเตอร์เทรด (ชุมพร-จันทบุรี)",
      locationId: chumphonLoc?.id,
      trustScore: 100,
      ratingAvg: 4.9,
    },
    {
      email: "cutter@durian.com",
      phone: "082-333-4444",
      fullName: "ช่างเอก มือตัดสายตะวันออก",
      activeRole: "CUTTER" as RoleType,
      businessName: "ทีมตัดทุเรียนช่างเอก (ทีม 8 คน)",
      locationId: rayongLoc?.id,
      trustScore: 100,
      ratingAvg: 5.0,
    },
    {
      email: "admin@durian.com",
      phone: "080-000-0000",
      fullName: "ผู้ดูแลระบบกลาง",
      activeRole: "ADMIN" as RoleType,
      businessName: "Durian Hub Official Admin",
      locationId: bkkLoc?.id,
      trustScore: 100,
      ratingAvg: 5.0,
    },
  ];

  for (const u of testUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const user = await prisma.user.create({
        data: {
          email: u.email,
          phone: u.phone,
          passwordHash: defaultPasswordHash,
          fullName: u.fullName,
          activeRole: u.activeRole,
          locationId: u.locationId,
          emailVerifiedAt: new Date(), // ยืนยันแล้ว เข้าใช้งานได้ทันที
          trustScore: u.trustScore,
          ratingAvg: u.ratingAvg,
        },
      });

      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleType: u.activeRole,
          isPrimaryRole: true,
          businessName: u.businessName,
          status: "ACTIVE",
          isVerified: true,
        },
      });
    }
  }
  console.log("✅ Seeded Test Users (password: password123)");

  // 6. Seed Marketplace Posts
  const seller = await prisma.user.findUnique({ where: { email: "seller@durian.com" } });
  const buyer = await prisma.user.findUnique({ where: { email: "buyer@durian.com" } });
  const cutter = await prisma.user.findUnique({ where: { email: "cutter@durian.com" } });

  const monthong = await prisma.durianVariety.findUnique({ where: { nameTh: "หมอนทอง" } });
  const abExport = await prisma.durianGrade.findUnique({ where: { gradeCode: "AB_EXPORT" } });

  const chanLocation = await prisma.location.findFirst({ where: { province: "จันทบุรี" } });
  const chumphonLocation = await prisma.location.findFirst({ where: { province: "ชุมพร" } });
  const rayongLocation = await prisma.location.findFirst({ where: { province: "ระยอง" } });

  if (seller && monthong && abExport && chanLocation) {
    const postCount = await prisma.marketplacePost.count();
    if (postCount === 0) {
      await prisma.marketplacePost.create({
        data: {
          userId: seller.id,
          postType: "SELL",
          varietyId: monthong.id,
          gradeId: abExport.id,
          locationId: chanLocation.id,
          title: "หมอนทองจันทบุรี สวนสมชาย GAP เกรด AB ตัดรอบแรก เม.ย. นี้",
          content: "ทุเรียนหมอนทองต้นสมบูรณ์ ดูแลด้วยมาตรฐาน GAP ตัดมีดแรกรับประกันเนื้อแห้ง หวานมัน ล้งไหนสนใจเหมาแปลงหรือรับซื้อหน้าสวน ทักแชทคุยได้ครับ มีผลผลิตประมาณ 5 ตัน",
          price: 172.0,
          pricePerKg: 172.0,
          priceUnit: "PER_KG",
          quantityKg: 5000.0,
          dryMatterPct: 32.5,
          availableDate: new Date(),
          status: "OPEN",
        },
      });

      if (buyer && chumphonLocation) {
        await prisma.marketplacePost.create({
          data: {
            userId: buyer.id,
            postType: "BUY",
            varietyId: monthong.id,
            gradeId: abExport.id,
            locationId: chumphonLocation.id,
            title: "ล้งเจริญผล รับซื้อหมอนทองเกรดส่งออกจีน ให้ราคาสูง จ่ายสดหน้าล้ง",
            content: "รับซื้อทุเรียนหมอนทองเกรด AB และเกรด C วันละ 20 ตัน มีทีมตัดและรถรับถึงหน้าสวน จ่ายเงินสดทันทีหลังชั่งน้ำหนัก สนใจทักแชทตกลงราคากันได้เลย",
            price: 175.0,
            pricePerKg: 175.0,
            priceUnit: "PER_KG",
            quantityKg: 20000.0,
            availableDate: new Date(),
            status: "OPEN",
          },
        });
      }

      if (cutter && rayongLocation) {
        await prisma.marketplacePost.create({
          data: {
            userId: cutter.id,
            postType: "CUT_SERVICE",
            varietyId: monthong.id,
            locationId: rayongLocation.id,
            title: "ทีมตัดช่างเอก ระยอง-จันทบุรี ว่างคิว 1-15 เม.ย. รับตัดคัดแป้งแม่นยำ",
            content: "ทีมตัดมืออาชีพ 8 คน เครื่องมือครบ คัดเปอร์เซ็นต์แป้งเกิน 32% ทุเรียนไม่ช้ำ งานไว ประสบการณ์กว่า 12 ปี คิดค่าตัดเป็นกิโลกรัมหรือเหมาแปลง",
            price: 5.5,
            pricePerKg: 5.5,
            priceUnit: "PER_KG",
            quantityKg: 10000.0,
            availableDate: new Date(),
            status: "OPEN",
          },
        });
      }
      console.log("✅ Seeded Initial Marketplace Posts (Sell, Buy, Cut Service)");
    }
  }

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
