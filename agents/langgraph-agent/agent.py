from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.tools import InjectedToolCallId, tool
from langchain_core.messages import ToolMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.tools import tool
from langgraph.types import Command, interrupt
from langchain_core.runnables.graph import MermaidDrawMethod

from langchain_ollama import ChatOllama
from langchain_google_genai import ChatGoogleGenerativeAI

# Rate limiting
import time
from functools import wraps
import random

import json
import getpass
import os

def _set_env(var: str):
    if not os.environ.get(var):
        os.environ[var] = getpass.getpass(f"{var}: ")

_set_env("TAVILY_API_KEY")
_set_env("GOOGLE_API_KEY")

# Add these rate limiting utilities
def rate_limit(min_delay=5.0, max_delay=7.0):
    """
    Decorator to add rate limiting with a random delay between min_delay and max_delay seconds.
    This helps avoid hitting API rate limits by spacing out requests.
    """
    def decorator(func):
        last_call_time = [0]  # Using a list to store mutable state
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Calculate time since last call
            current_time = time.time()
            time_since_last_call = current_time - last_call_time[0]
            
            # Determine how long to wait
            delay = random.uniform(min_delay, max_delay)
            if time_since_last_call < delay:
                time_to_wait = delay - time_since_last_call
                print(f"Rate limiting: waiting {time_to_wait:.2f} seconds...")
                time.sleep(time_to_wait)
            
            # Update last call time
            last_call_time[0] = time.time()
            
            # Call the original function
            return func(*args, **kwargs)
        
        return wrapper
    
    return decorator

memory = MemorySaver()

class State(TypedDict):
    # Messages have the type "list". The `add_messages` function
    # in the annotation defines how this state key should be updated
    # (in this case, it appends messages to the list, rather than overwriting them)
    messages: Annotated[list, add_messages]
    name: str
    birthday: str

graph_builder = StateGraph(State)

# Note that because we are generating a ToolMessage for a state update, we
# generally require the ID of the corresponding tool call. We can use
# LangChain's InjectedToolCallId to signal that this argument should not
# be revealed to the model in the tool's schema.
@tool
#def human_assistance(name: str, birthday: str, tool_call_id: Annotated[str, InjectedToolCallId]) -> str:
def human_assistance(query: str) -> str:
    """Request assistance from a human."""
    human_response ="We, the experts are here to help! We'd recommend you check out LangGraph to build your agent. "
    human_response +="It's much more reliable and extensible than simple autonomous agents. You can search the web for more information."
    return human_response

    # human_response = interrupt({"query": query})
    # return human_response["data"]

def route_tools(
    state: State,
):
    """
    Use in the conditional_edge to route to the ToolNode if the last message
    has tool calls. Otherwise, route to the end.
    """
    if isinstance(state, list):
        ai_message = state[-1]
    elif messages := state.get("messages", []):
        ai_message = messages[-1]
    else:
        raise ValueError(f"No messages found in input state to tool_edge: {state}")
    if hasattr(ai_message, "tool_calls") and len(ai_message.tool_calls) > 0:
        return "tools"
    return END

tool = TavilySearchResults(max_results=2)
tools = [tool, human_assistance]

llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro")
# llm = ChatOllama(model="llama3.2:1b", 
#                  api_key="ollama",     
#                  base_url="http://localhost:8008/",)
llm_with_tools = llm.bind_tools(tools)
tool_node = ToolNode(tools)

# Apply the rate limiting decorator to your chatbot function
@rate_limit(min_delay=5.0, max_delay=7.0)
def chatbot(state: State):
    message = llm_with_tools.invoke(state["messages"])
    # Because we will be interrupting during tool execution,
    # we disable parallel tool calling to avoid repeating any
    # tool invocations when we resume.
    print(len(message.tool_calls))
    assert len(message.tool_calls) <= 1
    return {"messages": [message]}

# The `tools_condition` function returns "tools" if the chatbot asks to use a tool, and "END" if
# it is fine directly responding. This conditional routing defines the main agent loop.
graph_builder.add_conditional_edges(
    "chatbot",
    tools_condition
)

# The first argument is the unique node name
# The second argument is the function or object that will be called whenever
# the node is used.
graph_builder.add_node("chatbot", chatbot)
graph_builder.add_node("tools", tool_node)

graph_builder.add_edge(START, "chatbot")
graph_builder.add_edge("tools", "chatbot")

graph_builder.add_edge("chatbot", END)

graph = graph_builder.compile(checkpointer=memory)

config = {"configurable": {"thread_id": "1"}}

def stream_graph_updates(user_input: str):

    try:
        # Invoke the graph
        messages = {"messages": [{"role": "user", "content": user_input}]}
        events = graph.stream(messages, config, stream_mode="values")
    except KeyboardInterrupt:
        # Handle the interrupt
        user_input = input("Graph interrupted. Please provide input to resume: ")
        events = graph.stream(Command(resume=user_input), config, stream_mode="values")

    for event in events:
         event["messages"][-1].pretty_print()

# def stream_graph_updates(user_input: str):
#     for event in graph.stream({"messages": [{"role": "user", "content": user_input}]}):
#         for value in event.values():
#             print("Assistant:", value["messages"][-1].content)

while True:
    # Generate and save the diagram as a PNG file
    graph.get_graph().draw_mermaid_png(
        draw_method=MermaidDrawMethod.API,
        output_file_path="graph_diagram.png"
    )

    #try:
    user_input = input("User: ")
    if user_input.lower() in ["quit", "exit", "q"]:
        print("Goodbye!")
        break
    try:
        stream_graph_updates(user_input)
    except KeyboardInterrupt:
        human_response = input("Graph interrupted. Please provide input to resume: ")
        human_command = Command(resume={"data": human_response})
        stream_graph_updates(human_command)

    #except:
        # fallback if input() is nvailable
        #print("error in user_input:", e)
    #    user_input = "What do you know about LangGraph?"
        #print("User: " + user_input)
        #stream_graph_updates(user_input)
    #    break