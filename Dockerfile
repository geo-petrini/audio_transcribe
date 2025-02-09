FROM python:3.11-alpine

EXPOSE 5000

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN flask db upgrade

CMD ["python", "app.py"]