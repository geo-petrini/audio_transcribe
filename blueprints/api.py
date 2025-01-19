from flask import Blueprint, request, jsonify

app = Blueprint('api', __name__)


@app.route('/data', methods=['GET'])
def get_data():
    query_param = request.args.get('param')
    response = {
        'message': 'Received GET request',
        'param': query_param
    }
    return jsonify(response), 200

@app.route('/submit', methods=['POST'])
def submit_data():
    form_data = request.form.get('data')
    response = {
        'message': 'Received POST request',
        'data': form_data
    }
    return jsonify(response), 201

@app.route('/update/<int:id>', methods=['PUT'])
def update_data(id):
    updated_data = request.json
    response = {
        'message': 'Received PUT request',
        'id': id,
        'updated_data': updated_data
    }
    return jsonify(response), 200

@app.route('/delete/<int:id>', methods=['DELETE'])
def delete_data(id):
    response = {
        'message': 'Received DELETE request',
        'id': id,
        'status': 'Resource deleted'
    }
    return jsonify(response), 200