// import {createServer} from "http"
// import {Server} from "socket.io"

// const app = createServer();
// const io = new Server(app, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// const rooms = {};

// // io.on("connection", (socket) => {
// //   console.log("Connected:", socket.id);

// //   socket.on("join", (roomId) => {
// //     socket.join(roomId);
// //     if (!rooms[roomId]) rooms[roomId] = [];
// //     rooms[roomId].push(socket.id);

// //     // Notify existing users
// //     rooms[roomId].forEach((id) => {
// //       if (id !== socket.id) {
// //         io.to(id).emit("user-joined", socket.id);
// //       }
// //     });
// //   });

// //   socket.on("offer", ({ offer, to }) => {
// //     io.to(to).emit("offer", { offer, from: socket.id });
// //   });

// //   socket.on("answer", ({ answer, to }) => {
// //     io.to(to).emit("answer", { answer });
// //   });

// //   socket.on("ice-candidate", ({ candidate, roomId }) => {
// //     rooms[roomId]?.forEach((id) => {
// //       if (id !== socket.id) io.to(id).emit("ice-candidate", { candidate });
// //     });
// //   });

// //   socket.on("disconnect", () => {
// //     for (const roomId in rooms) {
// //       rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
// //     }
// //   });
// // });

// // Bind to all LAN interfaces
// // app.listen(3001, "0.0.0.0", () => console.log("Socket.IO running on port 3001"));

// const PORT = process.env.PORT || 3001;

// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server running on port ${PORT}`);
// });

import { createServer } from "http";
import { Server } from "socket.io";

// Create HTTP server
const app = createServer();
const io = new Server(app, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Track rooms and users
const rooms = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // Join a room
  socket.on("join", (roomId) => {
    if (!rooms[roomId]) rooms[roomId] = [];

    // Send existing users to new user
    socket.emit("all-users", rooms[roomId]);

    // Add new user to room
    rooms[roomId].push(socket.id);
    socket.join(roomId);

    // Notify others in the room that a new user joined
    socket.to(roomId).emit("user-joined", socket.id);
  });

  // Forward offer to a specific peer
  socket.on("offer", ({ offer, to }) => {
    io.to(to).emit("offer", { offer, from: socket.id });
  });

  // Forward answer to a specific peer
  socket.on("answer", ({ answer, to }) => {
    io.to(to).emit("answer", { answer, from: socket.id });
  });

  // Forward ICE candidate to a specific peer
  socket.on("ice-candidate", ({ candidate, to }) => {
    io.to(to).emit("ice-candidate", { candidate, from: socket.id });
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      if (rooms[roomId].includes(socket.id)) {
        // Remove user from room
        rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);

        // Notify remaining users
        socket.to(roomId).emit("user-left", socket.id);

        // Cleanup empty room
        if (rooms[roomId].length === 0) delete rooms[roomId];
      }
    }
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

