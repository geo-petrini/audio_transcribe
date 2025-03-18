FROM python:3.11-alpine

EXPOSE 5000
RUN pip install --upgrade pip

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir uploads
COPY blueprints .
COPY static .
COPY models .
COPY modules .
COPY templates .
COPY migrations .

RUN flask db upgrade

CMD ["python", "app.py"]