# Getting the mega service chain running

## set up the environment

- set the environment variables

``` sh
source set_env.sh
```

environment vars were set up using reference material from https://hub.docker.com/r/ollama/ollama
then just pasting the docker-compose.yaml file into claude and asking for suggestions on how the vars need to be set up
only first 2 vars from shell script have been used in this project, adding the rest is TBD
telemetry is also disabled in the last 2 lines

- start docker services

``` sh
docker compose up -d
```

## pull the models

- for the query response service

``` sh
curl --noproxy "*" http://localhost:8008/api/pull -d '{
  "model": "llama3.2:1b"
}'
```

- for the response sentiment service

``` sh
curl --noproxy "*" http://localhost:8009/api/pull -d '{
  "model": "llama3.2:1b"
}'
```

## test the docker services

- test the query response service

``` sh
curl --noproxy "*" http://localhost:8008/api/generate -d '{
  "model": "llama3.2:1b",
  "prompt":"Why is the sky blue?"
}'
```

- test the response sentiment service

``` sh
curl --noproxy "*" http://localhost:8009/api/generate -d '{
  "model": "llama3.2:1b",
  "prompt":"Why is the sky blue?"
}'
```

## test the opea-comps routing

``` sh

curl -v -X POST \
  http://localhost:8000/v1/example_service \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [
        {
            "role": "user",
            "content": "Hello, how are you?"
        }
    ]
}'

```

## test the mega-service orchestrator for sentiment analysis

``` sh
curl -v -X POST \
  http://localhost:8000/v1/example_service \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [
        {
            "role": "user",
            "content": "why is the sky blue?"
        }
    ]
}'
```

``` sh
curl -v -X POST \
  http://localhost:8000/v1/example_service \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [
        {
            "role": "user",
            "content": "why is the world unfair?"
        }
    ]
}'
```
