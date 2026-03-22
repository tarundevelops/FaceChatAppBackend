import {createServer} from "http"
import {Server} from "socket.io"

const app = createServer();
const io = new Server(app, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join", (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);

    // Notify existing users
    rooms[roomId].forEach((id) => {
      if (id !== socket.id) {
        io.to(id).emit("user-joined", socket.id);
      }
    });
  });

  socket.on("offer", ({ offer, to }) => {
    io.to(to).emit("offer", { offer, from: socket.id });
  });

  socket.on("answer", ({ answer, to }) => {
    io.to(to).emit("answer", { answer });
  });

  socket.on("ice-candidate", ({ candidate, roomId }) => {
    rooms[roomId]?.forEach((id) => {
      if (id !== socket.id) io.to(id).emit("ice-candidate", { candidate });
    });
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
    }
  });
});

// Bind to all LAN interfaces
app.listen(3001, "0.0.0.0", () => console.log("Socket.IO running on port 3001"));