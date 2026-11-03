import { buildApp } from "./app.js";

const PORT = Number(process.env.PORT) || 3333;

async function start(): Promise<void> {
  const app = await buildApp({ logger: true });

  // Encerramento gracioso: fecha o servidor ao receber sinais de parada.
  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`Sinal ${signal} recebido. Encerrando...`);
    await app.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  try {
    const address = await app.listen({ port: PORT });
    app.log.info(`Formula 1 API rodando em ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void start();
