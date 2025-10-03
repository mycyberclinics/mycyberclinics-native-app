## Cyber Clinic Server (Koa2/MongoDB/Redis)

A backend API for Cyber Clinic mobile app (Expo React Native).

### Usage

```bash
cd server
npm install
npm run dev
```

### Endpoints

- **POST /api/signup** – Register user
- **POST /api/login** – Login, returns JWT
- **GET /api/getProfile** – Get profile
- **POST /api/setProfile** – Update profile
- **POST /api/requestResetPwd** – Request password reset
- **POST /api/createAppointment** – Create appointment
- **GET /api/getAppointments** – Get appointments

### License

MIT