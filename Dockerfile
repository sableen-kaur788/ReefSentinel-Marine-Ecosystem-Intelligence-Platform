FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV (compatible with Debian trixie)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set Python path to include current directory
ENV PYTHONPATH=/app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

# Expose the port
EXPOSE 7860

# Run the app
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "7860"]
