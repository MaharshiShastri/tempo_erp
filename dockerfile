FROM python:3.12
WORKDIR /app
LABEL name="tempo-erp-app"
LABEL version="v1.3.0"
LABEL description="Updated system to initiate with Global Production Pulse"
LABEL maintainer="Backend Team"
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
