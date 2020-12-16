let io;

module.exports = {
  init: (httpServer, clientPort) => {
    io = require("socket.io")(httpServer, {
      cors: {
        origin: `http://localhost:${clientPort}`,
        methods: ["GET", "POST"],
      },
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized");
    }
    return io;
  },
};
