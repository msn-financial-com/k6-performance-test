#FROM node:lts-alpine
#
#RUN mkdir -p /home/node/postman-to-k6/node_modules && chown -R node:node /home/node/postman-to-k6
#WORKDIR /home/node/postman-to-k6
#COPY package*.json ./
#USER node
#COPY --chown=node:node . .
#RUN npm install --only=production --ignore-scripts
#
#ENTRYPOINT ["node", "bin/postman-to-k6.js"]



#FROM node:16-alpine
FROM loadimpact/k6:latest
WORKDIR /app

LABEL maintainers="GreenTeam-msn"

RUN npm config set registry http://nexus.adm.financial.com/nexus/repository/nodejs/;

#COPY package.json .
#COPY entrypoint.sh .
COPY k6-script.js .
#COPY Dory_EnvironmentConfig.json .
#COPY Dory_Middleware.postman_collection.json .
#
#RUN chmod -R ugo+x entrypoint.sh
#RUN chmod 777 entrypoint.sh

#RUN npm install

#ENTRYPOINT ["./entrypoint.sh"]
CMD ["k6", "run", "k6-script.js"]
