import { loadConfig, createLogger } from "./config.js";
import { runServer } from "./server.js";

async function main(): Promise<void> {
  try {
    // Load configuration
    const config = loadConfig();
    const logger = createLogger(config);

    // Run the MCP server
    await runServer(config, logger);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Run
main().catch(console.error);
