# Getting the mega service running

## test the docker container serving ollama

``` sh
curl --noproxy "*" http://localhost:8008/api/generate -d '{
  "model": "llama3.2:1b",
  "prompt":"Why is the sky blue?"
}'
```

``` sh
curl --noproxy "*" http://localhost:8008/api/generate -d '{
  "model": "llama3.2:1b",
  "prompt":"Why is the sky blue?",
  "stream": false
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
