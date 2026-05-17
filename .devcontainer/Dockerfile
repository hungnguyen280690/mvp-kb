FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

RUN curl https://mise.run | sh
ENV PATH="/home/vscode/.local/bin:${PATH}"

RUN apt-get update && apt-get install -y \
    graphviz \
    plantuml \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g @anthropic-ai/claude-code
