"""Loopback-only Keld preview, with the /are/ entry routed to local Vite."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1] / 'prototype'

class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_head(self):
        target = urlsplit(self.path)
        if target.path in ('/are', '/are/'):
            destination = 'http://127.0.0.1:4193/are/'
            if target.query:
                destination += '?' + target.query
            self.send_response(302)
            self.send_header('Location', destination)
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return None
        return super().send_head()

if __name__ == '__main__':
    with ThreadingHTTPServer(('127.0.0.1', 4194), PreviewHandler) as server:
        print('Keld: http://127.0.0.1:4194/ (ARE requires Vite on port 4193)', flush=True)
        server.serve_forever()
