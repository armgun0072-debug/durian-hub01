const { execSync } = require("child_process");

async function initAndStart() {
  console.log("--------------------------------------------------");
  console.log("🍈 Durian Hub - Container Initialization Starting");
  console.log("--------------------------------------------------");

  // 1. Wait for MySQL Database to become available
  console.log("⏳ Waiting for MySQL database to be ready...");
  let connected = false;
  let attempts = 0;
  const maxAttempts = 30;

  while (!connected && attempts < maxAttempts) {
    try {
      execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
      connected = true;
      console.log("✅ MySQL schema synchronized successfully!");
    } catch {
      attempts++;
      console.log(
        `⏳ MySQL not ready yet (attempt ${attempts}/${maxAttempts}). Retrying in 2 seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  if (!connected) {
    console.error("❌ Failed to connect to MySQL after maximum retries. Exiting.");
    process.exit(1);
  }

  // Bring cached ratings from databases created before bilateral confirmation into line.
  execSync("npx prisma db execute --schema prisma/schema.prisma --stdin", {
    input: `
      UPDATE users u
      JOIN (
        SELECT r.reviewee_id,
          AVG(CASE WHEN d.status = 'COMPLETED' AND d.accepted_at IS NOT NULL
            AND d.initiator_confirmed_at IS NOT NULL AND d.receiver_confirmed_at IS NOT NULL
            THEN r.rating END) AS average_rating,
          COUNT(CASE WHEN d.status = 'COMPLETED' AND d.accepted_at IS NOT NULL
            AND d.initiator_confirmed_at IS NOT NULL AND d.receiver_confirmed_at IS NOT NULL
            THEN 1 END) AS review_count
        FROM user_reviews r JOIN deals d ON d.id = r.deal_id GROUP BY r.reviewee_id
      ) ratings ON ratings.reviewee_id = u.id
      SET u.rating_avg = COALESCE(ROUND(ratings.average_rating, 2), 0),
          u.rating_count = ratings.review_count;
    `,
    stdio: ["pipe", "inherit", "inherit"],
  });

  // 2. Seed reference data and optionally demo data.
  try {
    console.log("🌱 Checking and seeding initial data...");
    execSync("npx prisma db seed", { stdio: "inherit" });
    console.log("✅ Seed completed successfully!");
  } catch (err) {
    console.log("ℹ️ Database seeding finished (or data already present).");
  }

  // 3. Start Next.js Development Server
  console.log("--------------------------------------------------");
  console.log("🚀 Starting Durian Hub Next.js application on port 3000...");
  console.log("--------------------------------------------------");
  execSync("npm run dev", { stdio: "inherit" });
}

initAndStart();
