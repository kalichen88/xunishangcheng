import http from 'node:http';
import fs from 'node:fs';

const PORT = Number(process.env.MOCK_PORT ?? 9099);
const LOG = 'research/telegram-mock.log';
fs.writeFileSync(LOG, '');

const server = http.createServer((request, response) => {
  let body = '';
  request.on('data', (chunk) => {
    body += chunk;
  });
  request.on('end', () => {
    if (request.url?.includes('/sendMessage')) {
      try {
        const payload = JSON.parse(body);
        fs.appendFileSync(
          LOG,
          JSON.stringify(
            {
              url: request.url,
              chat_id: payload.chat_id,
              text_length: payload.text?.length,
              text: payload.text,
            },
            null,
            2,
          ) + '\n---\n',
        );
        console.log('MOCK_TELEGRAM received', payload.text?.length, 'chars');
      } catch (error) {
        console.error('bad payload', error);
      }
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ ok: true, result: { message_id: 1 } }));
      return;
    }
    response.writeHead(404, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ ok: false }));
  });
});

server.listen(PORT, '127.0.0.1', () => console.log(`mock telegram on ${PORT}`));
