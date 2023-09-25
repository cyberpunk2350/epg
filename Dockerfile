FROM node:18

WORKDIR /usr/src/app

RUN git clone --depth 1 -b master https://github.com/cyberpunk2350/epg.git $WORKDIR

RUN npm install
RUN npm run grab -- --site=tvguide.com --lang=en --cron="0 0 * * *" 
RUN npm run serve
EXPOSE 3001
#CMD [ "npm", "run", "serve" ]
