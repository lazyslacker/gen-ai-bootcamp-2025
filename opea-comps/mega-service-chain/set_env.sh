echo "setting environment variables"
export LLM_IMAGE="ollama/ollama"
export LLM_MODEL_ID="llama3.2:1b"
export LLM_QUERY_RESPONSE_PORT=8008
export LLM_RESPONSE_SENTIMENT_PORT=9009
export LLM_QUERY_RESPONSE_SERVICE_ENDPOINT="http://127.0.0.1:${LLM_QUERY_RESPONSE_PORT}/v1/query_response"
export LLM_RESPONSE_SENTIMENT_SERVICE_ENDPOINT="http://127.0.0.1:${LLM_RESPONSE_SENTIMENT_PORT}/v1/response_sentiment"
export LLM_FRONTEND_SERVICE_IP=${HOST_IP}
export LLM_FRONTEND_SERVICE_PORT=15173
export LLM_BACKEND_SERVICE_NAME=chatqna
export LLM_BACKEND_SERVICE_IP=${HOST_IP}
export LLM_BACKEND_SERVICE_PORT=18888
export LLM_NGINX_PORT=15176
export OTEL_TRACES_EXPORTER=none
export OTEL_METRICS_EXPORTER=none
export OPEA_TELEMETRY_OPTOUT=1
export OTEL_SDK_DISABLED=true