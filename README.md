put sentry and bull mcq

## Deployment Issue: Signup CORS

in. The API CORS allowlist now includes:

- `https://ug-skill.vercel.app`
- `http://localhost:5173`
- `http://localhost:3000`

Railway should also set:

```env
CORS_ORIGINS=https://ug-skill.vercel.app,http://localhost:5173
```
