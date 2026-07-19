FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY nginx-custom.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
RUN chmod -R a+rX /usr/share/nginx/html

RUN mkdir -p /usr/share/nginx/html/uploads

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
