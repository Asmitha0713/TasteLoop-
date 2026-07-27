# TasteLoop FastAPI endpoints

All protected endpoints use `Authorization: Bearer <access_token>`.

## Authentication and profiles

- `POST /api/auth/register` — register a Customer or Home Cook
- `POST /api/auth/login` — sign in with email or phone
- `POST /api/auth/refresh` — rotate a refresh token and issue a new token pair
- `POST /api/auth/logout` — revoke a refresh token
- `POST /api/auth/forgot-password` — request a single-use password reset token
- `POST /api/auth/reset-password` — set a new password with the reset token
- `POST /api/auth/change-password` — authenticated password change; revokes active refresh tokens
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
- `POST /api/foods/images` — upload a JPEG, PNG, or WebP food image (maximum 5 MB)
- `PATCH /api/foods/{food_id}` — edit and resubmit a food
- `PATCH /api/foods/{food_id}/availability` — activate or deactivate an owned food
- `DELETE /api/foods/{food_id}` — delete the cook's food
- `GET /api/orders/cook` — orders containing the cook's foods
- `POST /api/orders/{order_id}/accept` — atomically accept a confirmed order
- `PATCH /api/orders/{order_id}/status` — cook/admin order progress
- `GET /api/cook/earnings?period=month` — cook earnings summary
- `GET /api/cook/dashboard/stats` — authenticated home cook dashboard statistics, ratings, and recent orders
- `POST|GET|PATCH|DELETE /api/cook/bank-details` — manage the current cook's payout bank details

## Customer cart and orders

- `GET /api/favorites` — list the current customer's favorite foods
- `POST /api/favorites/{food_id}` — add an approved food to favorites
- `DELETE /api/favorites/{food_id}` — remove a food from favorites

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
- `GET /api/notifications` — list notifications and unread count
- `PATCH /api/notifications/{notification_id}/read` — mark one notification as read
- `PATCH /api/notifications/read-all` — mark all notifications as read

The checkout endpoint accepts `cash` or `card` as the selected payment method. It never accepts or stores raw card numbers. A real payment provider should own card collection and tokenization.

## Administration

- `GET /api/admin/dashboard` — system counts and delivered revenue
- `GET /api/admin/analytics/reports-revenue?period=month` — revenue series, order status totals, and report aggregation
- `GET|POST /api/admin/users` — search or create users
- `PATCH /api/admin/users/{user_id}/status` — activate, approve or suspend
- `GET /api/admin/foods` — moderation queue
- `PATCH /api/admin/foods/{food_id}/moderation` — approve/reject/flag
- `GET /api/admin/reports` — report queue
- `PATCH /api/admin/reports/{report_id}` — investigate or resolve

Only accounts whose MongoDB `role` is `admin` can access `/api/admin/*`. Create the first administrator directly in a controlled deployment process; public registration intentionally cannot request the admin role.
