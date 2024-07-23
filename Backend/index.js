const express = require("express");
const { connection } = require("./config/db");
const { userRoutes } = require("./routes/User.Routes");
const { groupRoutes } = require("./routes/Group.Routes");
const { UserModel } = require("./model/User.Model");
const { createServer } = require("http");
const { Server } = require("socket.io");

const cors = require("cors");

require("dotenv").config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.json());
app.use(cors());
app.get("/", (req, res) => {
    res.send("Server working");
});

app.use("/user", userRoutes);
app.use("/group", groupRoutes);
const obj = {};
io.on("connection", (socket) => {
    // console.log("User Joined");

    socket.on("createConnection", (userId) => {
        obj[userId] = socket.id;
    });

    socket.on("chatMsg", async (msg, receiverId, senderId) => {
        let newMsg = {
            message: msg,
            senderId: senderId,
            receiverId: receiverId,
        };
        await UserModel.updateOne(
            { _id: senderId },
            { $push: { chatMessageModel: newMsg } }
        );
        await UserModel.updateOne(
            { _id: receiverId },
            { $push: { chatMessageModel: newMsg } }
        );
        io.to(obj[receiverId]).emit("receivedMsg", msg, senderId);
    });
    
    socket.on('clear-chat', async ({ userId, otherUserId }) => {
        try {
          await UserModel.updateMany(
            { _id: { $in: [userId, otherUserId] } },
            { $pull: {
                chatMessageModel: {
                    $or: [
                        { senderId: mongoose.Types.ObjectId(userId), receiverId: mongoose.Types.ObjectId(otherUserId) },
                        { senderId: mongoose.Types.ObjectId(otherUserId), receiverId: mongoose.Types.ObjectId(userId) }
                    ]
                }
            }}
          );
          io.emit('deleteChatMessages', { userId, otherUserId });
        } catch (error) {
          socket.emit('error', 'Error clearing chat');
        }
      });
});

httpServer.listen(process.env.PORT, async () => {
    try {
        await connection;
        console.log("Connected to Database");
        console.log("server listening on port " + process.env.PORT);
    } catch (error) {
        console.log(error);
    }
});
