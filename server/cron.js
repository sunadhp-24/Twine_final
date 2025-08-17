import cron from "node-cron";
import moment from "moment-timezone";
import Notification from "./models/Notifications.js";
import Relationship from "./models/Relationship.js";

// Daily event reminders using cron logic
cron.schedule(
  "00 20 * * *", // Runs at 8:00 PM every day
  async () => {
    console.log(
      "Running daily event reminder job at 20:00 Asia/Kolkata timezone"
    );
    try {
      const now = moment().tz("Asia/Kolkata");
      const tomorrow = now.clone().add(1, "day");
      const tomorrowStart = tomorrow.clone().startOf("day").toDate();
      const tomorrowEnd = tomorrow.clone().endOf("day").toDate();

      await Notification.deleteMany({ type: 4 }); // Clear old reminders

      const relationships = await Relationship.find({
        "importantEvents.date": { $gte: tomorrowStart, $lt: tomorrowEnd },
      });

      const notifications = [];
      relationships.forEach((relationship) => {
        relationship.importantEvents.forEach((event) => {
          if (event.date >= tomorrowStart && event.date < tomorrowEnd) {
            notifications.push({
              user: relationship.user1,
              message: `Reminder: You have an important event "${event.event}" scheduled for tomorrow.`,
              read: false,
              timeStamp: new Date(),
              type: 4,
              relId: relationship._id,
            });
            notifications.push({
              user: relationship.user2,
              message: `Reminder: You have an important event "${event.event}" scheduled for tomorrow.`,
              read: false,
              timeStamp: new Date(),
              type: 4,
              relId: relationship._id,
            });
          }
        });
      });

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        console.log(`Created ${notifications.length} event reminders.`);
      }
    } catch (error) {
      console.error("Error running cron job for event reminders:", error);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);
