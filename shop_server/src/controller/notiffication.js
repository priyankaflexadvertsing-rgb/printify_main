
import cron from "node-cron"
import NotificationServices from "../service/notiffication/notiffication.js";

// Get all notifications --- only admin
export const getNotifications = async (req, res) => {
    try {
        const dummyNotifications = await NotificationServices.getAllNotiffication()
        // const dummyNotifications = [
        //     {
        //         _id: "1",
        //         title: "New Order Received",
        //         message: "You have received a new order from John Doe.",
        //         status: "unread",
        //         createdAt: new Date().toISOString(),
        //     },
        //     {
        //         _id: "2",
        //         title: "Payment Completed",
        //         message: "Payment of $50 has been completed by Jane Smith.",
        //         status: "unread",
        //         createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
        //     },
        //     {
        //         _id: "3",
        //         title: "System Update",
        //         message: "The system will undergo maintenance at midnight.",
        //         status: "read",
        //         createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        //     },
        //     {
        //         _id: "4",
        //         title: "New Message",
        //         message: "You have a new message from Admin.",
        //         status: "unread",
        //         createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        //     },
        //     {
        //         _id: "5",
        //         title: "Reminder",
        //         message: "Don't forget to review pending orders.",
        //         status: "read",
        //         createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        //     },
        // ];

        res.status(200).json({
            success: true,
            dummyNotifications,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || "Server Error",
        });
    }
};

// Update notification status --- only admin
export const updateNotification = async (req, res) => {
    try {
        const notification = await NotificationModel.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        // Update status to "read"
        notification.status = "read";
        await notification.save();

        const notifications = await NotificationModel.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            notifications,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || "Server Error",
        });
    }
};

// Delete read notifications older than 30 days (cron job)
cron.schedule("0 0 0 * * *", async () => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        await NotificationModel.deleteMany({
            status: "read",
            createdAt: { $lt: thirtyDaysAgo },
        });
        console.log("Deleted read notifications older than 30 days");
    } catch (error) {
        console.error("Error deleting old notifications:", error);
    }
});
