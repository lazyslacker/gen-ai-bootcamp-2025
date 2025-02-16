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

LLM_SERVICE_HOST_IP = os.getenv("LLM_SERVICE_HOST_IP", "localhost")
LLM_SERVICE_PORT = os.getenv("LLM_SERVICE_PORT", 8008)

class ExampleService:
    def __init__(self, host="0.0.0.0", port=8000):
        self.host = host
        self.port = port
        self.endpoint = "/v1/example_service"
        self.handle_request = self._handle_request
        self.megaservice = ServiceOrchestrator()

    def add_remote_service(self):
        llm = MicroService(
            name="llm",
            host=LLM_SERVICE_HOST_IP,
            port=LLM_SERVICE_PORT,
            endpoint="/api/generate",
            use_remote_service=True,
            service_type=ServiceType.LLM,
        )
        self.megaservice.add(llm)

    async def _handle_request(self, request: Request):
        # Get the request data
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
        
        # Set up parameters for LLM
        parameters = LLMParams(
            model="llama3.2:1b",
            max_tokens=1024,
            temperature=0.01,
            stream=True
        )

        # Forward to LLM service
        result_dict, _ = await self.megaservice.schedule(
            initial_inputs={
                "model": "llama3.2:1b",
                "prompt": prompt,
                "stream": True,
                "options": {
                    "temperature": 0.01,
                    "max_tokens": 1024
                }
            },
            llm_parameters=parameters
        )

        # Handle streaming response
        if isinstance(result_dict, dict) and isinstance(result_dict.get('llm/MicroService'), StreamingResponse):
            return result_dict['llm/MicroService']
        
        # Non-streaming response handling (fallback)
        if isinstance(result_dict, dict):
            print(f"Result dict: {result_dict}")
            
            # Handle Ollama response format
            llm_response = result_dict.get('llm/MicroService', {})
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
            output_datatype=ChatCompletionResponse,
        )

        self.service.add_route(self.endpoint, self.handle_request, methods=["POST"])

        self.service.start()        

example_service = ExampleService()
example_service.add_remote_service()
example_service.start()