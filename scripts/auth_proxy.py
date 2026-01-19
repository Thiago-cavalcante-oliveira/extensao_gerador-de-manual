import socket
import threading
import select
import base64
import os

# CONFIG
UPSTREAM_HOST = 'proxy.pmfi.pr.gov.br'
UPSTREAM_PORT = 8080
LOCAL_PORT = 3128
# Credentials: thiago.tco:Aresluci01!!
AUTH_STRING = "thiago.tco:Aresluci01!!"
AUTH_B64 = base64.b64encode(AUTH_STRING.encode('utf-8')).decode('utf-8')

def handle_client(client_sock):
    upstream_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        upstream_sock.connect((UPSTREAM_HOST, UPSTREAM_PORT))
    except Exception as e:
        print(f"❌ Failed to connect to upstream: {e}")
        client_sock.close()
        return

    # Read Client Request (peek)
    # We assume it's a CONNECT request generally for HTTPS registry
    request_data = b""
    try:
        # Read until \r\n\r\n or enough bytes
        # Just simple read
        request_data = client_sock.recv(4096)
    except:
        pass

    if not request_data:
        client_sock.close()
        upstream_sock.close()
        return

    # Check if CONNECT
    first_line = request_data.split(b'\r\n')[0].decode('utf-8', errors='ignore')
    method = first_line.split(' ')[0]

    if method == 'CONNECT':
        # We need to inject Proxy-Authorization
        # Reconstruct the request?
        # CONNECT google.com:443 HTTP/1.1
        # Host: google.com:443
        # ...
        
        # We can just inject the header after the first line
        parts = request_data.split(b'\r\n')
        new_headers = [parts[0]] # Request Line
        new_headers.append(f"Proxy-Authorization: Basic {AUTH_B64}".encode('utf-8'))
        
        # Append rest, skipping empty lines if any? 
        # Actually, split preserves headers.
        found_end = False
        body_start = b""
        
        # Find header end
        header_end_idx = request_data.find(b"\r\n\r\n")
        if header_end_idx != -1:
             headers_block = request_data[:header_end_idx]
             body_start = request_data[header_end_idx+4:]
             
             # Rebuild headers
             lines = headers_block.split(b"\r\n")
             new_lines = [lines[0]]
             new_lines.append(f"Proxy-Authorization: Basic {AUTH_B64}".encode('utf-8'))
             new_lines.extend(lines[1:])
             
             new_req_data = b"\r\n".join(new_lines) + b"\r\n\r\n" + body_start
        else:
             # Just prepend? Risky if incomplete.
             new_req_data = request_data # fallback
        
        # Send to Upstream
        upstream_sock.sendall(new_req_data)
        
        # Tunnel
        tunnel(client_sock, upstream_sock)
        
    else:
        # HTTP Proxy (GET, POST)
        # Assuming Absolute URI in request line for proxy
        # We just inject the header
        # GET http://registry... HTTP/1.1
        
        header_end_idx = request_data.find(b"\r\n\r\n")
        if header_end_idx != -1:
             headers_block = request_data[:header_end_idx]
             body_start = request_data[header_end_idx+4:]
             
             lines = headers_block.split(b"\r\n")
             new_lines = [lines[0]]
             new_lines.append(f"Proxy-Authorization: Basic {AUTH_B64}".encode('utf-8'))
             new_lines.extend(lines[1:])
             
             new_req_data = b"\r\n".join(new_lines) + b"\r\n\r\n" + body_start
             upstream_sock.sendall(new_req_data)
        else:
             upstream_sock.sendall(request_data) # Send as is if weird

        tunnel(client_sock, upstream_sock)

def tunnel(s1, s2):
    sockets = [s1, s2]
    try:
        while True:
            r, w, e = select.select(sockets, [], sockets, 10)
            if not r: continue # timeout check?
            if e: break
            
            for s in r:
                other = s2 if s is s1 else s1
                try:
                    data = s.recv(8192)
                except:
                    break
                
                if not data:
                    return # Closed

                try:
                    other.sendall(data)
                except:
                    return
    except:
        pass
    finally:
        s1.close()
        s2.close()

def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server.bind(('127.0.0.1', LOCAL_PORT))
        server.listen(10)
        print(f"🔹 Local Auth Proxy listening on {LOCAL_PORT} -> {UPSTREAM_HOST}:{UPSTREAM_PORT}")
        
        while True:
            client, addr = server.accept()
            t = threading.Thread(target=handle_client, args=(client,))
            t.daemon = True
            t.start()
    except Exception as e:
        print(f"Server Error: {e}")

if __name__ == "__main__":
    main()
