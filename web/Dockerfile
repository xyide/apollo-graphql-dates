FROM node:lts-alpine3.15

VOLUME /app

ENV PATH /app/node_modules/.bin:$PATH

COPY startup.sh /
RUN chmod +x /startup.sh

CMD ["/startup.sh"]
