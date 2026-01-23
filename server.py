#!/usr/bin/env python3
"""
Simple HTTP server to run the game locally.
This avoids CORS issues when loading assets.

Usage: 
  python3 server.py              # Run game server
  python3 server.py --editor      # Run tile matcher editor

Then open:
  http://localhost:8000/index.html (game)
  http://localhost:8000/generate-matrix.html (editor, or root with --editor)
"""

import http.server
import socketserver
import os
import argparse
import json

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    editor_mode = False  # Class variable for editor mode
    
    def do_GET(self):
        # If in editor mode and accessing root, redirect to generate-matrix.html
        if self.editor_mode and self.path == '/':
            self.path = '/generate-matrix.html'
        return super().do_GET()
    
    def end_headers(self):
        # Add CORS headers to allow local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def log_message(self, format, *args):
        # Suppress default logging for cleaner output
        pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run local HTTP server for game or tile editor')
    parser.add_argument('--editor', action='store_true', 
                       help='Run in editor mode (serves tile matcher at root)')
    args = parser.parse_args()
    
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Set editor mode on handler class
    MyHTTPRequestHandler.editor_mode = args.editor
    
    # Check if matrix file exists when starting in editor mode
    matrix_path = 'assets/tile-compatibility-matrix.json'
    if args.editor:
        if os.path.exists(matrix_path):
            try:
                with open(matrix_path, 'r') as f:
                    matrix = json.load(f)
                    tile_count = len([k for k in matrix.keys() if k.startswith('tile-') or k.startswith('bone-')])
                    print(f"✓ Found existing matrix with {tile_count} tiles")
            except json.JSONDecodeError:
                print(f"⚠ Warning: {matrix_path} exists but is not valid JSON")
            except Exception as e:
                print(f"⚠ Warning: Could not read {matrix_path}: {e}")
        else:
            print(f"ℹ No existing matrix found at {matrix_path} - starting fresh")
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        if args.editor:
            print(f"Server running in EDITOR mode at http://localhost:{PORT}/")
            print(f"Open http://localhost:{PORT}/ in your browser (or /generate-matrix.html)")
            print(f"Matrix file: {matrix_path}")
        else:
            print(f"Server running at http://localhost:{PORT}/")
            print(f"Open http://localhost:{PORT}/index.html in your browser")
        print("Press Ctrl+C to stop the server")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
