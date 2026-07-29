import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";
const port = Number(process.env.API_PORT ?? 4000);
const server = app.listen(port,()=>console.log(`CodeMuscle API listening on http://localhost:${port}`));
const shutdown = () => server.close(async()=>{await prisma.$disconnect();process.exit(0);});
process.on("SIGTERM",shutdown);
process.on("SIGINT",shutdown);
