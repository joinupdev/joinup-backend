FROM node:22 as development

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

EXPOSE 3000

RUN npm run build

CMD ["npm", "run", "dev"]


FROM node:22 as production

WORKDIR /app

COPY package*.json .

RUN npm ci --only=production

COPY --from=development /app/dist ./dist

EXPOSE 3000

CMD ["npm", "run", "start"]