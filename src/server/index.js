import { logger, env } from "#config/index.js";

const { PORT } = env;

const startServer = (app) => {
  app.listen(PORT || 5000, () => {
    logger.info(`Server running on http://localhost:${PORT}`.white.bold);
  });
};

export default startServer;
