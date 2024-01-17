FROM node:21-slim as buildFrontend
WORKDIR /frontend
ADD ./frontend /frontend
RUN npm install --maxsockets 1 && npm run build

FROM node:21-slim as run
RUN npm install -g serve nodemon && \
    apt update && \
    apt install supervisor -y

COPY ./docker/supervisor.conf /etc/supervisor/conf.d/services.conf
COPY --from=buildFrontend /frontend/build /frontend
COPY ./backend /backend
RUN npm install --maxsockets 1 --prefix ./backend

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/services.conf"]
