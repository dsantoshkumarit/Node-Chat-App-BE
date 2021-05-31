//Getting all the models
require("./models/User");
require("./models/Chatroom");
require("./models/Message");

require("dotenv").config();

const mongoose = require("mongoose");
mongoose
  .connect(process.env.DBURL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch((err) => console.log("Mongoose Connection Error: ", err.message));

const port = process.env.PORT;

const app = require("./app");

const server = app.listen(port, () => {
  console.log("Server is listening on port : ", port);
});

const Message = mongoose.model("Message");
const User = mongoose.model("User");

const io = require("socket.io")(server, {
  cors: {
    origin: process.env.FRONTENDURL,
    methods: ["GET", "POST"],
  },
});
const jwt = require("jwt-then");
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.query.token;

    const payload = await jwt.verify(token, process.env.SECRET);
    socket.userId = payload.id;

    next();
  } catch (err) {}
});

io.on("connection", (socket) => {
  console.log("Connected: " + socket.userId);
  socket.on("disconnect", () => {
    console.log("Disconnected:" + socket.userId);
  });

  socket.on("joinRoom", ({ chatroomId }) => {
    socket.join(chatroomId);
    console.log("A user joined chatroom: " + chatroomId);
  });

  socket.on("leaveRoom", ({ chatroomId }) => {
    socket.leave(chatroomId);
    console.log("A user left chatroom chatroom: " + chatroomId);
  });

  socket.on("chatroomMessage", async ({ chatroomId, message }) => {
    if (message.trim().length > 0) {
      const user = await User.findOne({ _id: socket.userId });
      const newMessage = new Message({
        chatroom: chatroomId,
        user: socket.userId,
        message,
      });
      io.to(chatroomId).emit("newMessage", {
        message,
        name: user.name,
        userId: socket.userId,
      });

      await newMessage.save();
    }
  });
});
