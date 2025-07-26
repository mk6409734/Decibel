FROM node:12.17.0-alpine
WORKDIR /usr/dist
COPY package.json ./
COPY tsconfig.json ./
RUN ls -a
RUN npm install
COPY ./dist ./
EXPOSE 5000 25000
CMD ["npm","start"]