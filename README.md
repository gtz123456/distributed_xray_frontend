npm build

screen -S mynext
npm start


bash
`
cat << 'EOF' > /tmp/quick_nginx.conf
events {}
http {
    server { 
        listen 80; 
        
        # All backend API routes → webservice:8004
        location ~* ^/(admin|signup|login|logout|user|realitykey|servers|version|releases|connect|heartbeat|traffic|payment|subscribe|redeem)(/.*)?$ {
            proxy_pass http://host.docker.internal:8004;
        }

        location /downloads/ {
            proxy_pass http://host.docker.internal:8004/downloads/;
        }
        
        # Other requests → frontend
        location / { 
            proxy_pass http://host.docker.internal:3000; 
        } 
    }
}
EOF

docker rm -f nginx-quick-proxy
docker run -d --name nginx-quick-proxy -p 80:80 -v /tmp/quick_nginx.conf:/etc/nginx/nginx.conf:ro --add-host=host.docker.internal:host-gateway --restart always nginx:latest
`