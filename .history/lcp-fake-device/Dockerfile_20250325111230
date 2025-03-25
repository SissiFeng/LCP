FROM --platform=$BUILDPLATFORM python:3.9-slim

# Set build arguments and environment variables
ARG BUILDPLATFORM
ARG TARGETPLATFORM
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# Add uv to PATH
ENV PATH="/root/.cargo/bin:$PATH"

# Copy requirements file
COPY requirements.txt .

# Install dependencies using uv
RUN uv pip install --upgrade -r requirements.txt

# Copy application code
COPY lcp_fake_device ./lcp_fake_device

# Expose port
EXPOSE 8000

# Set environment variables
ENV LCP_FAKE_HOST=0.0.0.0
ENV LCP_FAKE_PORT=8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python", "-m", "uvicorn", "lcp_fake_device.main:app", "--host", "0.0.0.0", "--port", "8000"] 
