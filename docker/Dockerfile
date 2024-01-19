FROM node:21-slim as buildFrontend
WORKDIR /frontend
ADD ./frontend /frontend
RUN npm install -g pnpm && pnpm install && npm run build

FROM node:21-slim as run
RUN npm install -g serve pnpm nodemon && \
    apt update && \
    apt install supervisor -y

COPY ./docker/supervisor.conf /etc/supervisor/conf.d/services.conf
COPY ./docker/supervisor-dev.conf /etc/supervisor/conf.d/services-dev.conf
COPY --from=buildFrontend /frontend /frontend
COPY ./backend /backend
RUN pnpm install --prefix ./backend

CMD ["supervisord", "-n", "-c", "/etc/supervisor/conf.d/services.conf"]
