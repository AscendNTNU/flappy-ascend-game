# TODO: Use smaller base image when things are working
FROM ubuntu:latest
MAINTAINER Ascend NTNU  "www.ascendntnu.no"

RUN apt-get update && apt-get install -y nodejs redis-server npm

ENV SERVER_PATH /root/flappyascend

RUN mkdir -p $SERVER_PATH


EXPOSE 6379


COPY ./ $SERVER_PATH

RUN cd $SERVER_PATH && npm install webpack webpack-dev-server dotenv express redis ws 

RUN npm install -g npm-run-all

# CMD cd $SERVER_PATH && run-p server watch
# CMD cd $SERVER_PATH && redis-server --daemonize yes && node server.js
CMD cd $SERVER_PATH && redis-server --daemonize yes && run-p server watch