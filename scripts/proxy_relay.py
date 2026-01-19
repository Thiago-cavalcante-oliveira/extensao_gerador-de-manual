import socket
import threading
import select
import base64

# Config
LOCAL_PORT = 9999
UPSTREAM_HOST = 'proxy.pmfi.pr.gov.br'
UPSTREAM_PORT = 8080
PROXY_USER = 'thiago.tco'
# Raw password from user input history or env verification
PROXY_PASS = 'Aresluci01!!' 

auth_str = f"{PROXY_USER}:{PROXY_PASS}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
AUTH_HEADER = f"Proxy-Authorization: Basic {auth_b64}"

def handle_client(client_socket):
    try:
        request = client_socket.recv(4096)
        if not request:
            client_socket.close()
            return

        # Connect to upstream proxy
        upstream = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        upstream.connect((UPSTREAM_HOST, UPSTREAM_PORT))

        # Check if it's a CONNECT request (HTTPS)
        first_line = request.split(b'\n')[0]
        if b'CONNECT' in first_line:
            # We need to send the CONNECT to the upstream WITH valid auth
            # Rewrite the request to include auth
            # But wait, we can just forward the connect line + our header?
            # Or construct a new request.
            # Easiest: Parse host/port from CONNECT line, then send format expected by upstream.
            # Actually, standard CONNECT is: CONNECT host:port HTTP/1.1
            # We just need to insert the header before the empty line.
            
            parts = request.split(b'\r\n\r\n')
            headers = parts[0].decode()
            if 'Proxy-Authorization' not in headers:
                headers += f"\r\n{AUTH_HEADER}"
            
            new_request = (headers + "\r\n\r\n").encode()
            
            upstream.sendall(new_request)
            
            # Now pipe data
        else:
            # HTTP request (GET/POST)
            # Just insert the header
            parts = request.split(b'\r\n\r\n')
            headers = parts[0].decode()
            if 'Proxy-Authorization' not in headers:
                headers += f"\r\n{AUTH_HEADER}"
            
            new_request = (headers + '\r\n\r\n').encode()
            if len(parts) > 1:
                new_request += parts[1] # Body if any
                
            upstream.sendall(new_request)

        # Pipe loops
        sockets = [client_socket, upstream]
        while True:
            readable, _, _ = select.select(sockets, [], [], 10)
            if not readable:
                break
            for s in readable:
                other = upstream if s is client_socket else client_socket
                data = s.recv(4096)
                if not data:
                    return
                other.sendall(data)
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client_socket.close()
        try:
            upstream.close()
        except:
            pass

def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind(('127.0.0.1', LOCAL_PORT))
    server.listen(5)
    print(f"Proxy Relay listening on {LOCAL_PORT} -> {UPSTREAM_HOST}:{UPSTREAM_PORT}")
    
    while True:
        client, addr = server.accept()
        t = threading.Thread(target=handle_client, args=(client,))
        t.daemon = True
        t.start()

if __name__ == '__main__':
    main()
