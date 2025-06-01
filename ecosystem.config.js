module.exports = {
  apps: [
    {
      name: "debate-checker-worker",
      script: "dotenv",
      args: "-e .env tsx scripts/start-worker.ts",
      interpreter: "tsx",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
