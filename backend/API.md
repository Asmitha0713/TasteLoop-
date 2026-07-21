# TasteLoop FastAPI endpoints

All protected endpoints use `Authorization: Bearer <access_token>`.

## Authentication and profiles

- `POST /api/auth/register` — register a Customer or Home Cook
- `POST /api/auth/login` — sign in with email or phone
- `POST /api/auth/refresh` — rotate a refresh token and issue a new token pair
- `POST /api/auth/logout` — revoke a refresh token
- `POST /api/auth/forgot-password` — request a single-use password reset token
- `POST /api/auth/reset-password` — set a new password with the reset token
- `GET /api/auth/me` — current authenticated user
- `GET /api/profile` — profile details
- `PATCH /api/profile` — customer or cook profile update

## Marketplace and cook menu

- `GET /api/foods` — approved food search, filters, sorting and pagination
- `GET /api/foods/categories` — available categories
- `GET /api/foods/{food_id}` — food and cook details
- `POST /api/foods/{food_id}/reviews` — add/update a verified-purchase review
- `GET /api/cooks` — active home cooks
- `GET /api/cooks/{cook_id}` — cook profile and available menu
- `GET /api/foods/mine/list` — current cook's menu
- `POST /api/foods` — submit a new food
- `PATCH /api/foods/{food_id}` — edit and resubmit a food
- `DELETE /api/foods/{food_id}` — delete the cook's food
- `GET /api/orders/cook` — orders containing the cook's foods
- `PATCH /api/orders/{order_id}/status` — cook/admin order progress
- `GET /api/cook/earnings?period=month` — cook earnings summary

## Customer cart and orders

- `POST /api/addresses` — create a saved delivery address
- `GET /api/addresses` — list the current customer's delivery addresses
- `GET /api/addresses/{address_id}` — fetch one owned delivery address
- `PATCH /api/addresses/{address_id}` — update an owned delivery address or make it default
- `DELETE /api/addresses/{address_id}` — delete an owned delivery address

- `GET /api/cart` — expanded cart and subtotal
- `POST /api/cart/items` — add a food and quantity
- `PATCH /api/cart/items/{food_id}` — change quantity
- `DELETE /api/cart/items/{food_id}` — remove an item
- `DELETE /api/cart` — clear cart
- `POST /api/orders` — validate the cart and place an order
- `GET /api/orders` — customer order history
- `POST /api/reports` — submit a marketplace report

The checkout endpoint accepts `cash` or `card` as the selected payment method. It never accepts or stores raw card numbers. A real payment provider should own card collection and tokenization.

## Administration

- `GET /api/admin/dashboard` — system counts and delivered revenue
- `GET|POST /api/admin/users` — search or create users
- `PATCH /api/admin/users/{user_id}/status` — activate, approve or suspend
- `GET /api/admin/foods` — moderation queue
- `PATCH /api/admin/foods/{food_id}/moderation` — approve/reject/flag
- `GET /api/admin/reports` — report queue
- `PATCH /api/admin/reports/{report_id}` — investigate or resolve

Only accounts whose MongoDB `role` is `admin` can access `/api/admin/*`. Create the first administrator directly in a controlled deployment process; public registration intentionally cannot request the admin role.
