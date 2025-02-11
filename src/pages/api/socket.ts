import { Server as ServerIO } from "socket.io";
import { NextApiRequest } from "next";
import { NextApiResponseServerIO } from "@/types/next";

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    console.log("Starting Socket.IO server...");
    
    const io = new ServerIO(res.socket.server as any, {
      path: "/api/socket",
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on("register", (wallet) => {
        console.log(`Client registered: ${wallet}`);
        socket.data.wallet = wallet;
      });

      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}

export const config = {
  api: { bodyParser: false }
};
