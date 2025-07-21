import { http, HttpResponse } from 'msw';

export const queryHandlers = [
  http.get('/assets', () => {
    return HttpResponse.json({
      message: 'Mock response for /assets',
      timestamp: new Date().toISOString()
    });
  })
];