FROM node:20-slim
WORKDIR /code
ADD ./ /code
RUN npm install
CMD ["npm", "run", "dev"]