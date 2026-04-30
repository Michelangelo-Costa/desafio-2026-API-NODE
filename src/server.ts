import "dotenv/config";
import app from "./app";
import { prisma } from "./utils/prisma";

const PORT = process.env.PORT ?? 3000;

async function main() {
  await prisma.$connect();
  console.log("✓ Banco de dados conectado");

  app.listen(PORT, () => {
    console.log(`✓ Servidor rodando na porta ${PORT}`);
    console.log(`  http://localhost:${PORT}/health`);
  });
}

main().catch((err) => {
  console.error("Falha ao iniciar:", err);
  process.exit(1);
});
