# Apollo GraphQL Date Handling

This project demonstrates using Javascript Date objects for queries and mutations in Apollo Client and Server and how you can ensure that all users across all time zones will see the same time when converting to a Javascript Date object in their local time zones.

## Requirements

To run this project, you'll need

- Docker and Docker Compose

## Starting the project

Simply use Docker Compose to start the project like so:

```
docker-compose up
```

or if you're using Docker Compose v2

```
docker compose up
```

Then use your browser to go to http://localhost:3000 and click the buttons to show date processing with or without adjustments.

## Stopping the project

Just use `ctrl+c` to stop running and then a `docker-compose down`
