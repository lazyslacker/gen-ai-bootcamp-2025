import argparse
import json
import os
import re

from comps import MegaServiceEndpoint, MicroService, ServiceOrchestrator, ServiceRoleType, ServiceType
from comps.cores.mega.utils import handle_message
from comps.cores.proto.api_protocol import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatCompletionResponseChoice,
    ChatMessage,
    UsageInfo,
)
from comps.cores.proto.docarray import LLMParams, RerankerParms, RetrieverParms
from fastapi import Request
from fastapi.responses import StreamingResponse
from langchain_core.prompts import PromptTemplate

QUERY_RESPONSE_LLM_SERVICE_HOST_IP = os.getenv("LLM_SERVICE_HOST_IP", "localhost")
QUERY_RESPONSE_LLM_SERVICE_PORT = os.getenv("LLM_SERVICE_PORT", 8008)

RESPONSE_SENTIMENT_LLM_SERVICE_HOST_IP = os.getenv("LLM_SERVICE_HOST_IP", "localhost")
RESPONSE_SENTIMENT_LLM_SERVICE_PORT = os.getenv("LLM_SERVICE_PORT", 8009)

def align_inputs(self, inputs, cur_node, runtime_graph, llm_parameters_dict, **kwargs):

    # Initialize context if not exists
    if not hasattr(self, 'context'):
        self.context = ""

    if self.services[cur_node].name == "llm_response_sentiment/MicroService" and hasattr(self, 'context') and self.context:
        next_inputs = {}
        next_inputs["model"] = "llama3.2:1b"
        next_inputs["prompt"] = "In one sentence, whats the sentiment of the following text: " + self.context
        next_inputs["stream"] = inputs["stream"]
        inputs = next_inputs

    return inputs

def align_outputs(self, data, cur_node, inputs, runtime_graph, llm_parameters_dict, **kwargs):

    if self.services[cur_node].name == "llm_query_response/MicroService":

        #  Store response in context for next service        
        if isinstance(data, dict) and 'response' in data:
            self.context = data['response']

    return data

def align_generator(self, gen, **kwargs):
    print(f"align generator: gen: {gen}")

class ExampleService:
    def __init__(self, host="0.0.0.0", port=8000):
        self.host = host
        self.port = port
        self.endpoint = "/v1/example_service"
        ServiceOrchestrator.align_inputs = align_inputs
        ServiceOrchestrator.align_outputs = align_outputs
        ServiceOrchestrator.align_generator = align_generator
        self.handle_request = self._handle_request
        self.megaservice = ServiceOrchestrator()
        self.context = ""

    def add_remote_service(self):
        llm_query_response = MicroService(
            name="llm_query_response",
            host=QUERY_RESPONSE_LLM_SERVICE_HOST_IP,
            port=QUERY_RESPONSE_LLM_SERVICE_PORT,
            endpoint="/api/generate",
            use_remote_service=True,
            service_type=ServiceType.LLM,
        )

        llm_response_sentiment = MicroService(
            name="llm_response_sentiment",
            host=RESPONSE_SENTIMENT_LLM_SERVICE_HOST_IP,
            port=RESPONSE_SENTIMENT_LLM_SERVICE_PORT,
            endpoint="/api/generate",
            use_remote_service=True,
            service_type=ServiceType.LLM,
        )

        self.megaservice.add(llm_query_response).add(llm_response_sentiment)
        self.megaservice.flow_to(llm_query_response, llm_response_sentiment)

    async def _handle_request(self, request: Request):
        # Get the request data
        print(f"enter handle request")

        data = await request.json()
        chat_request = ChatCompletionRequest.model_validate(data)
        
        # Extract the last message content as the prompt
        messages = chat_request.messages
        if not messages:
            return ChatCompletionResponse(
                model="llama3.2:1b",
                choices=[],
                usage=UsageInfo(),
                error="No messages provided"
            )
        
        # Get the last message content
        last_message = messages[-1]
        prompt = last_message["content"] if isinstance(last_message, dict) else last_message.content
        print(f"Prompt: {prompt}")
        
        # Set up parameters for LLM
        parameters = LLMParams(
            model="llama3.2:1b",
            max_tokens=1024,
            temperature=0.01,
            stream=False
        )

        print(f"call scheduler")

        # Forward to LLM service
        result_dict, runtime_graph = await self.megaservice.schedule(
            initial_inputs={
                "model": "llama3.2:1b",
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.01,
                    "max_tokens": 1024
                }
            },
            llm_parameters=parameters
        )

        print(f"result dict: {result_dict}")
        print(f"runtime graph: {runtime_graph}")

        for node, response in result_dict.items():
            if isinstance(response, StreamingResponse):
                return response

        # result_dict, runtime_graph = await self.megaservice.schedule(
        #     initial_inputs={
        #         "model": "llama3.2:1b",
        #         "prompt": 'tell me the sentiment of the following text: ' + result_dict.get('llm_query_response/MicroService').get('response'),
        #         "stream": False,
        #         "options": {
        #             "temperature": 0.01,
        #             "max_tokens": 1024
        #         }
        #     },
        #     llm_parameters=parameters
        # )

        # print(f"result dict: {result_dict}")
        # print(f"runtime graph: {runtime_graph}")

        # Handle streaming response
        if isinstance(result_dict, dict) and isinstance(result_dict.get('llm_response_sentiment/MicroService'), StreamingResponse):
            return result_dict['llm_response_sentiment/MicroService']
        
        # Non-streaming response handling (fallback)
        if isinstance(result_dict, dict):
            print(f"Result dict: {result_dict}")
            
            # Handle Ollama response format
            llm_response = result_dict.get('llm_response_sentiment/MicroService', {})
            response_text = llm_response.get('response', '')
            
            if not response_text:
                # Try to get response from the Ollama format
                response_text = llm_response.get('text', '')
            
            # If still no response, include debug info
            if not response_text:
                done_reason = llm_response.get('done_reason', 'unknown')
                response_text = f"No response generated (reason: {done_reason})"

            # Calculate usage from Ollama metrics
            prompt_eval_count = llm_response.get('prompt_eval_count', 0)
            eval_count = llm_response.get('eval_count', 0)
            usage = UsageInfo(
                prompt_tokens=prompt_eval_count,
                completion_tokens=eval_count,
                total_tokens=prompt_eval_count + eval_count
            )
        else:
            response_text = str(result_dict)
            usage = UsageInfo()

        # Format response in ChatCompletion format
        choices = [
            ChatCompletionResponseChoice(
                index=0,
                message=ChatMessage(role="assistant", content=response_text),
                finish_reason="stop",
            )
        ]
        
        return ChatCompletionResponse(
            model="llama3.2:1b",
            choices=choices,
            usage=usage
        )

    def start(self):

        self.service = MicroService(
            self.__class__.__name__,
            service_role=ServiceRoleType.MEGASERVICE,
            host=self.host,
            port=self.port,
            endpoint=self.endpoint,
            input_datatype=ChatCompletionRequest,
            output_datatype=ChatCompletionResponse)

        print(f"start self")
        self.service.add_route(self.endpoint, self.handle_request, methods=["POST"])

        self.service.start() 
        print(f"start self done")

example_service = ExampleService()
example_service.add_remote_service()
example_service.start()