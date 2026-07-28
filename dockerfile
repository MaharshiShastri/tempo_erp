FROM python:3.12
WORKDIR /app
LABEL name="tempo-erp-app"
LABEL version="v1.5.0"
LABEL description="Updated the system to produce geo analytics"
LABEL maintainer="Backend Team"
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN chmod +x docker-entrypoint.sh
EXPOSE 8500
ENTRYPOINT [ "./docker-entrypoint.sh" ]
