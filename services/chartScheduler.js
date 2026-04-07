const cron = require("node-cron");
const Song = require("../models/Song");
const Artist = require("../models/Artist");
const Album = require("../models/Album");
const Genre = require("../models/Genre");

// ============================
// WEEKLY RESET (Every Monday)
// ============================
cron.schedule("0 0 * * 1", async () => {
  try {

    await Song.updateMany({}, { weeklyScore: 0 });
    await Artist.updateMany({}, { weeklyScore: 0 });
    await Album.updateMany({}, { weeklyScore: 0 });
    await Genre.updateMany({}, { weeklyScore: 0 });

    console.log("✅ Weekly chart reset complete");

  } catch (err) {
    console.error("Weekly reset error:", err);
  }
});


// ============================
// MONTHLY RESET (1st day)
// ============================
cron.schedule("0 0 1 * *", async () => {
  try {

    await Song.updateMany({}, { monthlyScore: 0 });
    await Artist.updateMany({}, { monthlyScore: 0 });
    await Album.updateMany({}, { monthlyScore: 0 });
    await Genre.updateMany({}, { monthlyScore: 0 });

    console.log("✅ Monthly chart reset complete");

  } catch (err) {
    console.error("Monthly reset error:", err);
  }
});


// ============================
// YEARLY RESET (Jan 1)
// ============================
cron.schedule("0 0 1 1 *", async () => {
  try {

    await Song.updateMany({}, { yearlyScore: 0 });
    await Artist.updateMany({}, { yearlyScore: 0 });
    await Album.updateMany({}, { yearlyScore: 0 });
    await Genre.updateMany({}, { yearlyScore: 0 });

    console.log("✅ Yearly chart reset complete");

  } catch (err) {
    console.error("Yearly reset error:", err);
  }
});