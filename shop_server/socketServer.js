import { Server } from "socket.io";


export const initSocketServer = (server) => {
    const io = new Server(server);

    io.on("connection", (socket) => {
        console.log(`A user connected ${socket.id}`);

        // Listen for 'notification' event from the frontend
        socket.on("notification", (data) => {
            // brodcost the notiffication data to all connected admin
            io.emit("newNotification", data);
        });

        socket.on("disconnect", () => {
            console.log("A user disconnected");
        });
    });
};