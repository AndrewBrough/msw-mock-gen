import { http, HttpResponse } from 'msw';

export const mutationHandlers = [
  http.post('/auth/login', () => {
    return HttpResponse.json({
      message: 'Mock response for /auth/login',
      timestamp: new Date().toISOString()
    });
  })
];