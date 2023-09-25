FROM node:18

WORKDIR /usr/src/app

RUN git clone --depth 1 -b master https://github.com/cyberpunk2350/epg.git
RUN mv -rf /usr/src/app/epg/* /usr/src/app/
RUN npm install
RUN npm run grab -- --site=tvguide.com --lang=en
#npm run serve
EXPOSE 3001
CMD [ "npm", "run", "serve" ]
