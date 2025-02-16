# Configuration for running OPEA-COMPs

export LLM_MODEL_ID=llama3.2:1b
export LLM_ENDPOINT_PORT=8008
export host_ip=192.168.1.75
export no_proxy=localhost

•$(hostname -I | awk '{print $1}')

curl --noproxy "*" http://localhost:8008/api/generate -d '{"model": "llama3.2:1b" }'

curl --noproxy "*" http://localhost:8008/api/pull -d '{"model": "llama3.2:1b", "prompt":"Why is the sky blue?" }'
