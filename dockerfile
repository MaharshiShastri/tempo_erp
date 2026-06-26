FROM python:3.11
WORKDIR /app
LABEL name="tempo-erp-app"
LABEL version="v1.2.1"
LABEL description="Tempo ERP backend API with lead generator + overnight scraping engine"
LABEL maintainer="Backend Team"
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
