FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# Install mise (version pinning via .mise.toml)
RUN curl https://mise.run | sh
ENV PATH="/home/vscode/.local/bin:${PATH}"

# mise will install exact versions from .mise.toml on postCreateCommand
# Java 21, Maven 3.9.9, Node 20, pnpm 9, Python 3.12, etc.

# Pre-install diagram + build tools
RUN apt-get update && apt-get install -y \
    graphviz \
    plantuml \
    && rm -rf /var/lib/apt/lists/*

# Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code
