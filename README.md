Application to receive data from osmands online tracking feature, receive it and display it as tracks on a map.

# Deployment
## Dependencies
- Server: 
  - java runtime. Change line in service file according to your environment.
  - nginx to avoid running application as root

Copy the service file to your chosen users unit file directory (~/.config/systemd/user/). Modify according to your needs

Configure nginx, the provided nginx.conf is not complete and contains only the relevant sections for this application. Configure ssl and hostnames yourself.

mkdir /opt/gpstracker-backend with read/write access for your chosen user.

set env variable DEPLOY_SERVER to your host

```export DEPLOY_SERVER=myuser@myserver```

Execute deploy.sh

Tis will first build and then deploy both front- and backend