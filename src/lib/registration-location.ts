import type { Prisma } from "@prisma/client";

export async function registrationLocation(tx: Prisma.TransactionClient, province: string, region: string) {
  const deepSouthProvinces = ["ยะลา", "ปัตตานี", "นราธิวาส"];
  const southProvinces = ["ชุมพร", "สุราษฎร์ธานี", "นครศรีธรรมราช", "ระนอง", "พังงา", "กระบี่", "ภูเก็ต", "ตรัง", "พัทลุง", "สงขลา", "สตูล"];
  const eastProvinces = ["จันทบุรี", "ระยอง", "ตราด", "ชลบุรี", "ฉะเชิงเทรา", "ปราจีนบุรี", "นครนายก", "สระแก้ว"];
  const isanProvinces = ["ชัยภูมิ", "ศรีสะเกษ", "นครราชสีมา", "ขอนแก่น", "อุบลราชธานี", "บุรีรัมย์", "สุรินทร์", "อุดรธานี", "เลย", "หนองคาย", "หนองบัวลำภู", "บึงกาฬ", "สกลนคร", "นครพนม", "มุกดาหาร", "ยโสธร", "อำนาจเจริญ", "ร้อยเอ็ด", "กาฬสินธุ์", "มหาสารคาม"];
  const northProvinces = ["อุตรดิตถ์", "เชียงใหม่", "เชียงราย", "แพร่", "น่าน", "ลำปาง", "ลำพูน", "กำแพงเพชร", "พิจิตร", "ตาก", "สุโขทัย", "พิษณุโลก", "เพชรบูรณ์", "แม่ฮ่องสอน", "นครสวรรค์", "พะเยา", "อุทัยธานี"];

  let targetRegion = region;
  const provTrim = province;

  if (!targetRegion && provTrim) {
    if (deepSouthProvinces.some((p) => provTrim.includes(p))) {
      targetRegion = "3 จังหวัดชายแดนใต้";
    } else if (southProvinces.some((p) => provTrim.includes(p))) {
      targetRegion = "ภาคใต้";
    } else if (eastProvinces.some((p) => provTrim.includes(p))) {
      targetRegion = "ภาคตะวันออก";
    } else if (isanProvinces.some((p) => provTrim.includes(p))) {
      targetRegion = "ภาคอีสาน";
    } else if (northProvinces.some((p) => provTrim.includes(p))) {
      targetRegion = "ภาคเหนือ";
    } else {
      targetRegion = "ภาคกลาง";
    }
  }
  if (!targetRegion) targetRegion = "ภาคตะวันออก";

  let locationId: number | undefined = undefined;
  if (provTrim) {
    // Find matching regionalSeasonId
    const season = await tx.regionalSeason.findFirst({
      where: {
        OR: [
          { regionName: targetRegion },
          { regionName: { contains: targetRegion } },
        ],
      },
    });

    const loc = await tx.location.findFirst({
      where: { province: provTrim },
    });
    if (loc) {
      locationId = loc.id;
    } else {
      const createdLoc = await tx.location.upsert({
        where: { province_district: { province: provTrim, district: "เมือง" } },
        update: {},
        create: {
          province: provTrim,
          district: "เมือง",
          region: targetRegion,
          regionalSeasonId: season?.id,
        },
      });
      locationId = createdLoc.id;
    }
  }

  return locationId;
}
