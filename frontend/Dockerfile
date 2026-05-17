FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /build
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY apps/ apps/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm build

FROM nginx:alpine
COPY --from=build /build/apps/shell/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
