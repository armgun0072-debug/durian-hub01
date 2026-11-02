FROM node:20-slim

WORKDIR /app

# ติดตั้ง openssl เพื่อให้ Prisma Client บน Linux ทำงานได้อย่างถูกต้อง
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# คัดลอกเฉพาะ package.json และ prisma schema ก่อน เพื่อใช้ประโยชน์จาก Docker Layer Caching
COPY package*.json ./
COPY prisma ./prisma/

# ติดตั้ง dependencies และ generate Prisma Client
RUN npm install
RUN npx prisma generate

# คัดลอกโค้ดทั้งหมดของโปรเจกต์
COPY . .

# เปิดพอร์ต 3000 สำหรับ Next.js
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=development

# สั่งรัน script รอ DB พร้อม -> ซิงค์ Schema -> Seed ข้อมูล -> สตาร์ท Next.js
CMD ["node", "docker-entrypoint.js"]
