# QR Bill Split

A full-stack restaurant app. Guests scan the QR code on their table, order from the menu, split the bill between themselves and pay from their phones. The restaurant manages tables, menu and staff from a web dashboard and sees sales analytics there.

The project has three parts: a .NET backend, a mobile app for guests and a web dashboard for the restaurant.

## Features

**Guests (mobile app)**

- Scan a table QR code and join the table session
- Browse the menu, pick product options, add to cart
- See the shared bill update live as others at the table order or pay
- Split the bill in several ways:
  - pay for individual items, fully or partially
  - split the remaining amount evenly, with cents distributed so nothing is lost to rounding
  - split one shared item between chosen people
  - add tax and tip in proportion to each person's share
  - "roulette": a random unpaid item is assigned to a random person at the table
- Register and log in with email, password and a one-time code
- Receipts and profile screens, Turkish and English interface

**Restaurant (web dashboard)**

- Create tables and print their QR codes as PDF
- Follow table status and open sessions in real time
- Manage menu, product options and employees
- Analytics: daily summary and history of closed tables

## Tech stack

| Part | Technologies |
|---|---|
| Backend | ASP.NET Core Web API (.NET 10), Entity Framework Core, PostgreSQL, SignalR, JWT authentication, BCrypt, QRCoder, Swagger |
| Mobile | React Native with Expo, TypeScript, expo-camera, SignalR client, Axios |
| Web | React 19, Vite, TypeScript, Tailwind CSS, Recharts, react-pdf, i18next |

## Project structure

```
src/backend/          ASP.NET Core API
  API/                Controllers, middleware, Program.cs
  Core/               Models, DTOs, interfaces, exceptions
  Infrastructure/     DbContext, seed data, EF Core migrations
  Services/           Bill-split logic, OTP sender, SignalR hub
src/mobile/           Guest app (React Native + Expo)
web/                  Restaurant dashboard (React + Vite)
```

## How to run

**Requirements:** .NET 10 SDK, Node.js, PostgreSQL.

1. **Database.** Start PostgreSQL and create a database. The connection string is in `src/backend/appsettings.json` (default: database `SplitAppDb` on `localhost:5433`).

2. **Backend**

   ```bash
   cd src/backend
   dotnet ef database update
   dotnet run
   ```

   The API listens on `http://localhost:5079`. Sample data is added on first start.

3. **Web dashboard**

   ```bash
   cd web
   npm install
   npm run dev
   ```

4. **Mobile app**

   ```bash
   cd src/mobile
   npm install
   npx expo start
   ```

   To test on a real phone, change `BASE_URL` in `src/mobile/src/services/api.ts` from `localhost` to your computer's local IP address.

## Known limitations

This is a learning project, not a production system.

- Payments are simulated. No real payment provider is connected.
- One-time codes are printed to the backend console instead of being emailed.
- The database password and the JWT signing key in the repository are development defaults. Set your own through configuration (`ConnectionStrings:DefaultConnection`, `Jwt:Key`) before using it anywhere real.
- API addresses in the mobile and web clients are hard-coded to `localhost`.

## Author

Mehmet Berke Eyigün — Computer Engineering, Acıbadem Mehmet Ali Aydınlar University
