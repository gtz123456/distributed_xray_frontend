npm build

screen -S mynext
env PORT=80 npm start


bash
`
cat << 'EOF' > /tmp/quick_nginx.conf
events {}
http {
    server { listen 80; location / { proxy_pass http://host.docker.internal:3000; } }
    server { listen 8080; location / { proxy_pass http://host.docker.internal:8004; } }
}
EOF

docker run -d --name nginx-quick-proxy -p 80:80 -p 8080:8080 -v /tmp/quick_nginx.conf:/etc/nginx/nginx.conf:ro --add-host=host.docker.internal:host-gateway --restart always nginx:latest
`