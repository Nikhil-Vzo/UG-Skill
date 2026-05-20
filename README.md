put sentry and bull mcq

## Deployment Issue: Signup CORS

Signup from the deployed frontend can fail if the Railway API does not allow the Vercel origin. The API CORS allowlist now includes:

- `https://ug-skill.vercel.app`
- `http://localhost:5173`
- `http://localhost:3000`

Railway should also set:

```env
CORS_ORIGINS=https://ug-skill.vercel.app,http://localhost:5173
```
