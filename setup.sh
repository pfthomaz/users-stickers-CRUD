cp .env.sample .env
D:\\PostgreSQL\\10\\bin\\createdb -U postgres sticker-mania
npm install
knex migrate:latest
knex seed:run
