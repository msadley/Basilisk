module.exports = {
  apps: [{
    name: "relay",
    cwd: "./apps/relay",
    script: "./dist/index.js",
    watch: ["./Basilisk/apps/relay/dist"],
    cron_restart: "0 4 * * *",
    instances: "max",
    exec_mode: "cluster",
    env: {
      PUBLIC_DNS: "basilisk-relay.ddns.net"
    }
  }]
}