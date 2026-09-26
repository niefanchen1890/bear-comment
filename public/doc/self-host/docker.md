# Docker 自託管

## 需求

- Docker Engine
- Docker Compose plugin
- 可解析至 VPS 的 domain
- nginx 或其他 HTTPS reverse proxy

## 啟動

```sh
cp .env.example .env
chmod 600 .env
# 編輯所有必要值
docker compose config
docker compose up -d --build
docker compose ps
curl --fail http://127.0.0.1:3000/api/health
```

PostgreSQL 沒有 host port；Bear Comment 只綁定 `127.0.0.1:3000`。不要把 PostgreSQL
或 Node port 直接暴露至公網。

container 啟動時會執行已提交的 Prisma migrations。不要在正式環境執行
`prisma migrate dev` 或 `prisma db push`。

## 必要設定

至少設定：

- `POSTGRES_PASSWORD` 與對應 `DB_URL`
- `NEXTAUTH_URL`、`HOST`
- `JWT_SECRET`
- `CUSDIS_ADMIN_USERNAME`、`CUSDIS_ADMIN_PASSWORD`
- `CORS_ORIGINS`

完整變數以 repository 的 `.env.example` 為準。

## 備份

```sh
docker compose exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > cusdis-$(date +%F).dump
chmod 600 cusdis-$(date +%F).dump
```

每次升級與 migration 前先備份，並定期將備份移出 VPS。
