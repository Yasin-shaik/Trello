let io;

const initSocket = (httpServer) => {
    io = require('socket.io')(httpServer, {
        cors: {
            origin: "*", 
            methods: ["GET", "POST"]
        }
    });
    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = {
    initSocket,
    getIo
};
