import { http, HttpResponse } from 'msw';

export const handlers = [
  http.all('/assets', () => {
    return HttpResponse.json({
      message: 'Mock response for /assets',
      timestamp: new Date().toISOString()
    });
  })
];