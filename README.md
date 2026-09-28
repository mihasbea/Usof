# Usof

RESTful API for USOF - a knowledge-sharing Q&A platform for developers. Built with Node.js, Express, and MySQL, featuring a custom rating system, role-based access, and content subscriptions.

## Requirements

- Node.js 20 or newer
- MySQL 8

## Setup

1. Install the dependencies:

    ```sh
    npm install
    ```

2. Copy `.env.example` to `.env` and fill in the values (MySQL credentials, `JWT_SECRET`, Mailtrap credentials).

3. Create the database, its tables and the seed data:

    ```sh
    npm run init-db
    ```

    The script can be run again safely: existing seed rows are skipped.

4. Start the server:

    ```sh
    npm start       # or: npm run dev   (restarts on file changes)
    ```

    The API runs on `http://localhost:3000` (or the `PORT` from `.env`).

## Seed users

All seeded users have the password `Password123`.

| Login           | Role  |
| --------------- | ----- |
| `mmykhalchenko` | admin |
| `vshaforostova` | user  |
| `dburlachenko`  | user  |
| `rferchuk`      | user  |
| `amilshina`     | user  |
| `vkasatonov`    | user  |

## API

Protected endpoints need the header `Authorization: Bearer <token>`; the token comes from `POST /api/auth/login`.

### Auth — `/api/auth`

| Method | Path                             | Description                                                        |
| ------ | -------------------------------- | ------------------------------------------------------------------ |
| POST   | `/register`                      | `login`, `password`, `password_confirmation`, `full_name`, `email` |
| POST   | `/login`                         | `password` and either `login` or `email`                           |
| POST   | `/logout`                        | Revokes the current token (auth)                                   |
| POST   | `/password-reset`                | `email`; sends a reset link                                        |
| POST   | `/password-reset/:confirm_token` | `new_password`, `new_password_confirmation`                        |
| GET    | `/confirm-email/:token`          | Confirms the email address (link from the confirmation email)      |

### Users — `/api/users`

| Method | Path        | Description                                                    |
| ------ | ----------- | -------------------------------------------------------------- |
| GET    | `/`         | All users (public fields only)                                 |
| GET    | `/:user_id` | One user (public fields only)                                  |
| POST   | `/`         | Create a user with a `role` (admin)                            |
| PATCH  | `/avatar`   | Upload an avatar, form-data field `avatar` (auth)              |
| PATCH  | `/:user_id` | Update `login`, `email`, `password`, `full_name` (owner/admin) |
| DELETE | `/:user_id` | Delete a user and their files (owner/admin)                    |

### Posts — `/api/posts`

Who sees what: guests see active posts and comments; a logged-in user also sees their own inactive ones; an admin sees everything. A hidden post answers `404`, the same as a missing one. An inactive post is locked: it can't get new comments or likes.

| Method | Path                   | Access       | Description                                                                          |
| ------ | ---------------------- | ------------ | ------------------------------------------------------------------------------------ |
| GET    | `/`                    | public       | Posts the caller may see, paginated, sorted and filtered (see below)                 |
| POST   | `/`                    | auth         | `title`, `content`, `categories` (`"1,2"` or `[1, 2]`), up to 10 `attachments` files |
| GET    | `/:post_id`            | public       | The post with its like counts, categories and attachments                            |
| PATCH  | `/:post_id`            | author/admin | Author: `title`, `content`, `categories`. Admin: `categories`, `status`              |
| DELETE | `/:post_id`            | author/admin | Deletes the post with its comments, likes and files                                  |
| GET    | `/:post_id/categories` | public       | The post's categories                                                                |
| GET    | `/:post_id/comments`   | public       | The post's comments, oldest first                                                    |
| POST   | `/:post_id/comments`   | auth         | `content`; only under active posts                                                   |
| GET    | `/:post_id/like`       | public       | All likes and dislikes under the post                                                |
| POST   | `/:post_id/like`       | auth         | `type`: `like` (default) or `dislike`; one per user, sending the other type switches |
| DELETE | `/:post_id/like`       | auth         | Removes your own like or dislike                                                     |

Query parameters of `GET /api/posts`:

| Parameter              | Values                           | Default |
| ---------------------- | -------------------------------- | ------- |
| `page`                 | positive integer                 | `1`     |
| `limit`                | 1–100                            | `10`    |
| `sort`                 | `likes`, `date`                  | `likes` |
| `order`                | `asc`, `desc`                    | `desc`  |
| `status`               | `active`, `inactive`             | —       |
| `categories`           | category IDs, e.g. `1,3`         | —       |
| `date_from`, `date_to` | `YYYY-MM-DD`, both days included | —       |

A user's `rating` is the number of likes minus dislikes under all their posts and comments. It is updated in the same transaction as every like change.

## Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm start`            | Start the server                     |
| `npm run dev`          | Start the server and restart on edit |
| `npm run init-db`      | Create the database and seed data    |
| `npm run lint`         | Check the code with ESLint           |
| `npm run format`       | Format the code with Prettier        |
| `npm run format:check` | Check the formatting without writing |
