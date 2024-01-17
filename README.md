# BPROF Viewer
A viewer for BPROF traces.

## Getting Started

1. Apply your MySQL configuration to the below `docker-compose.yml` file.
2. Run `docker-compose up -d`
3. Navigate to `http://localhost:1337`

```dockerfile
version: "3.7"
services:
  bprof:
    image: nexelity/bprof-viewer:latest
    ports:
      - "1337:1337"
      - "31337:31337"
    environment:
      - DB_HOSTNAME=127.0.0.1
      - DB_USERNAME=root
      - DB_DATABASE=example
      - DB_TABLE_NAME=bprof_traces
      - DB_PORT=3306
      - DB_PASSWORD=Example123!
```